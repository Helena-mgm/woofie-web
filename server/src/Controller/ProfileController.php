<?php

namespace App\Controller;

use App\Entity\Owner;
use App\Entity\Sitter;
use App\Repository\OwnerRepository;
use App\Repository\SitterRepository;
use App\Repository\DogRepository;
use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ProfileController extends AbstractController
{
    private string $jwtKey;

    public function __construct()
    {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function getUserFromToken(Request $request, UserRepository $userRepository): ?\App\Entity\User
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtKey, 'HS256'));
            return $userRepository->find($decoded->sub);
        } catch (\Exception $e) {
            return null;
        }
    }

    #[Route('/api/profile/dogs', name: 'api_profile_dogs', methods: ['GET'])]
    public function getUserDogs(
        Request $request,
        UserRepository $userRepository,
        OwnerRepository $ownerRepository
    ): JsonResponse {
        $user = $this->getUserFromToken($request, $userRepository);
        
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        // Find owner by user ID
        $owner = $ownerRepository->findOneBy(['user' => $user]);
        
        if (!$owner) {
            return new JsonResponse(['error' => 'Owner profile not found'], Response::HTTP_NOT_FOUND);
        }

        // Get all dogs for this owner
        $dogs = $owner->getDogs();
        $data = [];

        foreach ($dogs as $dog) {
            $data[] = [
                'id' => $dog->getId(),
                'name' => $dog->getNom(),
                'breed' => $dog->getRace(),
                'photo' => $dog->getPhotoPath(),
            ];
        }

        return new JsonResponse($data);
    }
    #[Route('/api/profile/{id}', name: 'api_profile', methods: ['GET'])]
    public function getProfile(
        int $id,
        OwnerRepository $ownerRepo,
        SitterRepository $sitterRepo
    ): JsonResponse {
        // Try to find by Owner ID first
        $owner = $ownerRepo->find($id);
        if ($owner) {
            return new JsonResponse($this->formatOwnerProfile($owner));
        }

        // Try to find by Sitter ID
        $sitter = $sitterRepo->find($id);
        if ($sitter) {
            return new JsonResponse($this->formatSitterProfile($sitter));
        }

        // Try to find by User ID (Owner)
        $owner = $ownerRepo->findOneBy(['user' => $id]);
        if ($owner) {
            return new JsonResponse($this->formatOwnerProfile($owner));
        }

        // Try to find by User ID (Sitter)
        $sitter = $sitterRepo->findOneBy(['user' => $id]);
        if ($sitter) {
            return new JsonResponse($this->formatSitterProfile($sitter));
        }

        return new JsonResponse(['error' => 'Profile not found'], 404);
    }

    private function formatOwnerProfile(Owner $owner): array
    {
        $dogs = [];
        foreach ($owner->getDogs() as $dog) {
            // Get all photos for the dog
            $photos = [];
            foreach ($dog->getPhotos() as $dogPhoto) {
                $photos[] = $dogPhoto->getPhotoPath();
            }

            $dogs[] = [
                'id' => $dog->getId(),
                'nom' => $dog->getNom(),
                'race' => $dog->getRace(),
                'sexe' => $dog->getSexe(),
                'dateNaissance' => $dog->getDateNaissance()?->format('Y-m-d'),
                'description' => $dog->getDescription(),
                'photoPath' => $dog->getPhotoPath(),
                'photos' => $photos, // Gallery of all photos
            ];
        }

        return [
            'id' => $owner->getId(),
            'type' => 'owner',
            'nom' => $owner->getNom(),
            'ville' => $owner->getVille(),
            'telephone' => $owner->getTelephone(),
            'photoPath' => $owner->getPhotoPath(),
            'email' => $owner->getUser()->getEmail(),
            'dogs' => $dogs,
            'stats' => [
                'totalDogs' => count($dogs),
                'member_since' => $owner->getCreatedAt()->format('Y-m-d'),
            ]
        ];
    }

    private function formatSitterProfile(Sitter $sitter): array
    {
        return [
            'id' => $sitter->getId(),
            'type' => 'sitter',
            'nom' => $sitter->getNom(),
            'prenom' => $sitter->getPrenom(),
            'ville' => $sitter->getVille(),
            'telephone' => $sitter->getTelephone(),
            'photoPath' => $sitter->getPhotoPath(),
            'email' => $sitter->getUser()->getEmail(),
            'siret' => $sitter->getSiret(),
            'isVerified' => $sitter->getIsVerified(),
            'bio' => $sitter->getBio(),
            'services' => $sitter->getServices(),
            'price_per_hour' => $sitter->getPricePerHour() !== null ? (float) $sitter->getPricePerHour() : null,
            'is_available' => $sitter->isAvailable(),
            'experience_years' => $sitter->getExperienceYears(),
            'stats' => [
                'verified' => $sitter->getIsVerified(),
                'member_since' => $sitter->getCreatedAt()->format('Y-m-d'),
            ]
        ];
    }

    #[Route('/api/dog/{id}', name: 'api_dog', methods: ['GET'])]
    public function getDog(int $id, DogRepository $dogRepo): JsonResponse
    {
        $dog = $dogRepo->find($id);
        
        if (!$dog) {
            return new JsonResponse(['error' => 'Dog not found'], 404);
        }

        // Get all photos for the dog
        $photos = [];
        foreach ($dog->getPhotos() as $dogPhoto) {
            $photos[] = $dogPhoto->getPhotoPath();
        }

        return new JsonResponse([
            'id' => $dog->getId(),
            'nom' => $dog->getNom(),
            'race' => $dog->getRace(),
            'sexe' => $dog->getSexe(),
            'dateNaissance' => $dog->getDateNaissance()?->format('Y-m-d'),
            'description' => $dog->getDescription(),
            'photoPath' => $dog->getPhotoPath(),
            'photos' => $photos, // Gallery of all photos
            'owner' => [
                'id' => $dog->getOwner()->getId(),
                'nom' => $dog->getOwner()->getNom(),
                'prenom' => $dog->getOwner()->getPrenom(),
                'fullName' => $dog->getOwner()->getFullName(),
            ]
        ]);
    }
}
