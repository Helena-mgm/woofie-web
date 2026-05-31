<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class LocationController
{
    #[Route('/api/locations', name: 'api_locations', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return new JsonResponse([
            ['id' => 1, 'name' => 'Paris'],
            ['id' => 2, 'name' => 'Lyon'],
        ]);
    }
}
