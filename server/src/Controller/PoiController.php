<?php

namespace App\Controller;

use App\Repository\PointOfInterestRepository;
use App\Service\OverpassImporter;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PoiController extends AbstractController
{
    public function __construct(
        private readonly PointOfInterestRepository $poiRepository,
        private readonly OverpassImporter $overpassImporter,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/api/pois', name: 'api_pois', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $south = $request->query->get('south');
        $west = $request->query->get('west');
        $north = $request->query->get('north');
        $east = $request->query->get('east');

        if ($south === null || $west === null || $north === null || $east === null) {
            return $this->json(['error' => 'Missing bounds parameters'], Response::HTTP_BAD_REQUEST);
        }

        $bounds = [
            'south' => (float) $south,
            'west' => (float) $west,
            'north' => (float) $north,
            'east' => (float) $east,
        ];

        $results = $this->fetchFromCache($bounds['south'], $bounds['west'], $bounds['north'], $bounds['east']);

        if (empty($results)) {
            $results = $this->warmupCache($bounds['south'], $bounds['west'], $bounds['north'], $bounds['east']);
        }

        $elements = array_map(static function ($poi) {
            $tags = $poi->getTags() ?? [];
            $tags['name'] = $poi->getName();

            switch ($poi->getCategory()) {
                case 'veterinary':
                    $tags['amenity'] = 'veterinary';
                    break;
                case 'dog_park':
                    $tags['leisure'] = 'dog_park';
                    break;
                case 'pet_shop':
                    $tags['shop'] = $tags['shop'] ?? 'pet';
                    break;
                case 'pet_grooming':
                    $tags['amenity'] = 'pet_grooming';
                    break;
            }

            return [
                'id' => $poi->getId(),
                'osm_id' => $poi->getOsmId(),
                'lat' => $poi->getLatitude(),
                'lon' => $poi->getLongitude(),
                'tags' => $tags,
            ];
        }, $results);

        return $this->json([
            'elements' => $elements,
            'source' => 'database',
        ]);
    }

    /**
     * @return array<int, \App\Entity\PointOfInterest>
     */
    private function fetchFromCache(float $south, float $west, float $north, float $east): array
    {
        return $this->poiRepository->findWithinBounds($south, $west, $north, $east);
    }

    /**
     * Attempts to populate the POI cache from Overpass and returns newly persisted items.
     *
     * @return array<int, \App\Entity\PointOfInterest>
     */
    private function warmupCache(float $south, float $west, float $north, float $east): array
    {
        try {
            $persisted = $this->overpassImporter->import($south, $west, $north, $east);

            if (!empty($persisted)) {
                return $this->fetchFromCache($south, $west, $north, $east);
            }
        } catch (\Throwable $exception) {
            $this->logger->error('Failed to refresh POIs from Overpass', [
                'exception' => $exception,
                'south' => $south,
                'west' => $west,
                'north' => $north,
                'east' => $east,
            ]);
        }

        return [];
    }
}
