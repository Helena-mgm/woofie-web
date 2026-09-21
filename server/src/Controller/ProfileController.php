<?php

namespace App\Controller;

use App\Entity\Owner;
use App\Entity\Sitter;
use App\Repository\OwnerRepository;
use App\Repository\SitterRepository;
use App\Repository\DogRepository;
use App\Repository\UserRepository;
use App\Service\JwtService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ProfileController extends AbstractController
{
    public function __construct(private JwtService $jwtService)
    {
    }

    private function getUserFromToken(Request $request): ?\App\Entity\User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    #[Route('/api/profile/dogs', name: 'api_profile_dogs', methods: ['GET'])]
    public function getUserDogs(
        Request $request,
        OwnerRepository $ownerRepository
    ): JsonResponse {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $owner = $ownerRepository->findOneBy(['user' => $user]);
        
        if (!$owner) {
            return new JsonResponse(['error' => 'Owner profile not found'], Response::HTTP_NOT_FOUND);
        }

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
    #[Route('/api/profile/{id}', name: 'api_profile', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getProfile(
        int $id,
        UserRepository $userRepository,
        OwnerRepository $ownerRepo,
        SitterRepository $sitterRepo
    ): JsonResponse {
        $user = $userRepository->find($id);
        if (!$user) {
            return new JsonResponse(['error' => 'Profile not found'], 404);
        }

        $owner = $ownerRepo->findOneBy(['user' => $user]);
        if ($owner) {
            return new JsonResponse($this->formatOwnerProfile($owner));
        }

        $sitter = $sitterRepo->findOneBy(['user' => $user]);
        if ($sitter) {
            return new JsonResponse($this->formatSitterProfile($sitter));
        }

        return new JsonResponse(['error' => 'Profile not found'], 404);
    }

    private function formatOwnerProfile(Owner $owner): array
    {
        $dogs = [];
        foreach ($owner->getDogs() as $dog) {
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
                'photos' => $photos,
            ];
        }

        return [
            'id' => $owner->getUser()->getId(),
            'type' => 'owner',
            'nom' => $owner->getNom(),
            'prenom' => $owner->getPrenom(),
            'ville' => $owner->getVille(),
            'photoPath' => $owner->getPhotoPath(),
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
            'id' => $sitter->getUser()->getId(),
            'type' => 'sitter',
            'nom' => $sitter->getNom(),
            'prenom' => $sitter->getPrenom(),
            'ville' => $sitter->getVille(),
            'photoPath' => $sitter->getPhotoPath(),
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

    #[Route('/api/dog/{id}', name: 'api_dog', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getDog(int $id, DogRepository $dogRepo): JsonResponse
    {
        $dog = $dogRepo->find($id);
        
        if (!$dog) {
            return new JsonResponse(['error' => 'Dog not found'], 404);
        }

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
            'photos' => $photos,
            'owner' => [
                'id' => $dog->getOwner()->getUser()->getId(),
                'nom' => $dog->getOwner()->getNom(),
                'prenom' => $dog->getOwner()->getPrenom(),
                'fullName' => $dog->getOwner()->getFullName(),
            ]
        ]);
    }
}
