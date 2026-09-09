<?php

namespace App\Controller;

use App\Repository\PointOfInterestRepository;
use App\Service\OverpassImporter;
use App\Service\LoginRateLimiter;
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
        private readonly LoginRateLimiter $rateLimiter,
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

        $rawBounds = compact('south', 'west', 'north', 'east');
        foreach ($rawBounds as $value) {
            if (!is_scalar($value) || !is_numeric((string) $value)) {
                return $this->json(['error' => 'Invalid bounds parameters'], Response::HTTP_BAD_REQUEST);
            }
        }

        $bounds = array_map(static fn(mixed $value): float => (float) $value, $rawBounds);
        if (!is_finite($bounds['south']) || !is_finite($bounds['west'])
            || !is_finite($bounds['north']) || !is_finite($bounds['east'])
            || $bounds['south'] < -90 || $bounds['north'] > 90
            || $bounds['west'] < -180 || $bounds['east'] > 180
            || $bounds['south'] >= $bounds['north'] || $bounds['west'] >= $bounds['east']) {
            return $this->json(['error' => 'Invalid bounds parameters'], Response::HTTP_BAD_REQUEST);
        }

        if (($bounds['north'] - $bounds['south']) > 2 || ($bounds['east'] - $bounds['west']) > 2) {
            return $this->json(['error' => 'Requested area is too large; zoom in and retry'], Response::HTTP_BAD_REQUEST);
        }

        if ($retryAfter = $this->rateLimiter->assertPoiAllowed((string) $request->getClientIp())) {
            return $this->json(
                ['error' => 'Too many map requests'],
                Response::HTTP_TOO_MANY_REQUESTS,
                ['Retry-After' => (string) $retryAfter]
            );
        }

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
