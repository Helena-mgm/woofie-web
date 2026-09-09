<?php

namespace App\Service;

use App\Entity\PointOfInterest;
use App\Repository\PointOfInterestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class OverpassImporter
{
    private const OVERPASS_ENDPOINTS = [
        'https://overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter',
        'https://overpass.openstreetmap.fr/api/interpreter',
        'https://overpass.osm.ch/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly PointOfInterestRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return PointOfInterest[]
     */
    public function import(float $south, float $west, float $north, float $east): array
    {
        $query = sprintf(
            '[out:json][timeout:25];
            (
              node["amenity"="veterinary"](%1$s,%2$s,%3$s,%4$s);
              way["amenity"="veterinary"](%1$s,%2$s,%3$s,%4$s);
              relation["amenity"="veterinary"](%1$s,%2$s,%3$s,%4$s);
              node["shop"="pet"](%1$s,%2$s,%3$s,%4$s);
              way["shop"="pet"](%1$s,%2$s,%3$s,%4$s);
              relation["shop"="pet"](%1$s,%2$s,%3$s,%4$s);
              node["shop"="pet_food"](%1$s,%2$s,%3$s,%4$s);
              way["shop"="pet_food"](%1$s,%2$s,%3$s,%4$s);
              relation["shop"="pet_food"](%1$s,%2$s,%3$s,%4$s);
              node["amenity"="pet_grooming"](%1$s,%2$s,%3$s,%4$s);
              way["amenity"="pet_grooming"](%1$s,%2$s,%3$s,%4$s);
              relation["amenity"="pet_grooming"](%1$s,%2$s,%3$s,%4$s);
              node["leisure"="dog_park"](%1$s,%2$s,%3$s,%4$s);
              way["leisure"="dog_park"](%1$s,%2$s,%3$s,%4$s);
              relation["leisure"="dog_park"](%1$s,%2$s,%3$s,%4$s);
            );
            out center 200;',
            $south,
            $west,
            $north,
            $east
        );

        $encoded = http_build_query(['data' => preg_replace("/\s+/", ' ', trim($query))]);

        $elements = $this->fetchFromOverpass($encoded);
        if (empty($elements)) {
            return [];
        }

        $persisted = [];
        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            $rawId = $element['id'] ?? null;
            $rawType = $element['type'] ?? null;
            if ((!is_int($rawId) && !is_string($rawId)) || (string) $rawId === ''
                || !is_string($rawType) || !in_array($rawType, ['node', 'way', 'relation'], true)) {
                continue;
            }

            $coords = $this->extractCoordinates($element);
            if ($coords === null) {
                continue;
            }
            $tags = is_array($element['tags'] ?? null) ? $element['tags'] : [];
            $category = $this->resolveCategory($tags);
            if ($category === null) {
                continue;
            }

            $legacyOsmId = (string) $rawId;
            $osmId = $rawType . ':' . $legacyOsmId;
            $poi = $this->repository->findOneBy(['osmId' => $osmId])
                ?? $this->repository->findOneBy(['osmId' => $legacyOsmId]);
            if (!$poi) {
                $poi = new PointOfInterest();
            }

            $name = is_string($tags['name'] ?? null)
                ? mb_substr(trim($tags['name']), 0, 255)
                : null;

            $poi
                ->setOsmId($osmId)
                ->setName($name !== '' ? $name : null)
                ->setCategory($category)
                ->setLatitude($coords['lat'])
                ->setLongitude($coords['lon'])
                ->setTags($tags ?: null)
                ->touch();

            $this->repository->upsert($poi);
            $persisted[] = $poi;
        }

        $this->entityManager->flush();

        return $persisted;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchFromOverpass(string $encodedQuery): array
    {
        foreach (self::OVERPASS_ENDPOINTS as $endpoint) {
            try {
                $response = $this->httpClient->request('POST', $endpoint, [
                    'body' => $encodedQuery,
                    'headers' => [
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ],
                    'timeout' => 15,
                ]);

                if ($response->getStatusCode() >= 400) {
                    $response = $this->httpClient->request('GET', sprintf('%s?%s', $endpoint, $encodedQuery), [
                        'timeout' => 15,
                    ]);
                }

                if ($response->getStatusCode() < 400) {
                    $payload = $response->toArray(false);
                    if (isset($payload['elements']) && is_array($payload['elements'])) {
                        return $payload['elements'];
                    }
                }
            } catch (TransportExceptionInterface | ClientExceptionInterface | RedirectionExceptionInterface | ServerExceptionInterface) {
                // try next endpoint
            }
        }

        return [];
    }

    /**
     * @param array<string, mixed> $element
     */
    private function extractCoordinates(array $element): ?array
    {
        if (isset($element['lat'], $element['lon'])) {
            return $this->validCoordinates($element['lat'], $element['lon']);
        }

        if (isset($element['center']['lat'], $element['center']['lon'])) {
            return $this->validCoordinates($element['center']['lat'], $element['center']['lon']);
        }

        if (!empty($element['bounds'])) {
            $bounds = $element['bounds'];
            if (isset($bounds['minlat'], $bounds['maxlat'], $bounds['minlon'], $bounds['maxlon'])) {
                return $this->validCoordinates(
                    ((float)$bounds['minlat'] + (float)$bounds['maxlat']) / 2,
                    ((float)$bounds['minlon'] + (float)$bounds['maxlon']) / 2
                );
            }
        }

        if (!empty($element['geometry']) && is_array($element['geometry'])) {
            $totalLat = 0.0;
            $totalLon = 0.0;
            $count = 0;
            foreach ($element['geometry'] as $geometryPoint) {
                if (isset($geometryPoint['lat'], $geometryPoint['lon'])) {
                    $totalLat += (float)$geometryPoint['lat'];
                    $totalLon += (float)$geometryPoint['lon'];
                    $count++;
                }
            }

            if ($count > 0) {
                return $this->validCoordinates($totalLat / $count, $totalLon / $count);
            }
        }

        return null;
    }

    /** @return array{lat: float, lon: float}|null */
    private function validCoordinates(mixed $latitude, mixed $longitude): ?array
    {
        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            return null;
        }

        $lat = (float) $latitude;
        $lon = (float) $longitude;
        if (!is_finite($lat) || !is_finite($lon) || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            return null;
        }

        return ['lat' => $lat, 'lon' => $lon];
    }

    /**
     * @param array<string, mixed> $tags
     */
    private function resolveCategory(array $tags): ?string
    {
        return match (true) {
            isset($tags['amenity']) && $tags['amenity'] === 'veterinary' => 'veterinary',
            isset($tags['leisure']) && $tags['leisure'] === 'dog_park' => 'dog_park',
            isset($tags['amenity']) && $tags['amenity'] === 'pet_grooming' => 'pet_grooming',
            isset($tags['shop']) && in_array($tags['shop'], ['pet', 'pet_food'], true) => 'pet_shop',
            default => null,
        };
    }
}
