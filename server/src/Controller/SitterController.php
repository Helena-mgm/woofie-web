<?php

namespace App\Controller;

use App\Entity\Sitter;
use App\Entity\User;
use App\Repository\SitterRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SitterController extends AbstractController
{
    private string $jwtKey;

    public function __construct()
    {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function getUserFromToken(Request $request, UserRepository $userRepository): ?User
    {
        $authHeader = $request->headers->get('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtKey, 'HS256'));
            return $userRepository->find($decoded->sub);
        } catch (\Throwable $e) {
            return null;
        }
    }

    #[Route('/api/sitters', name: 'api_sitters_list', methods: ['GET'])]
    public function list(Request $request, SitterRepository $repository): JsonResponse
    {
        $serviceFilter = $request->query->get('service');
        $cityFilter = $request->query->get('city');
        $availableFilter = $request->query->get('available');

        $sitters = $repository->findBy(['isVerified' => true]);

        $filtered = array_filter($sitters, static function (Sitter $sitter) use ($serviceFilter, $cityFilter, $availableFilter) {
            if ($availableFilter !== null) {
                $shouldBeAvailable = filter_var($availableFilter, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($shouldBeAvailable !== null && $sitter->isAvailable() !== $shouldBeAvailable) {
                    return false;
                }
            }

            if ($serviceFilter) {
                $services = $sitter->getServices() ?? [];
                $serviceMatch = false;
                foreach ($services as $service) {
                    if (mb_strtolower($service) === mb_strtolower($serviceFilter)) {
                        $serviceMatch = true;
                        break;
                    }
                }
                if (!$serviceMatch) {
                    return false;
                }
            }

            if ($cityFilter) {
                if (mb_stripos($sitter->getVille(), $cityFilter) === false) {
                    return false;
                }
            }

            return true;
        });

        $data = array_map(fn (Sitter $sitter) => $this->mapSitter($sitter), $filtered);

        return new JsonResponse(array_values($data));
    }

    #[Route('/api/sitters/me', name: 'api_sitters_me', methods: ['GET'])]
    public function getMyProfile(
        Request $request,
        UserRepository $userRepository,
        SitterRepository $sitterRepository
    ): JsonResponse {
        $user = $this->getUserFromToken($request, $userRepository);

        if (!$user || $user->getType() !== 'sitter') {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $sitter = $sitterRepository->findOneBy(['user' => $user]);

        if (!$sitter) {
            return new JsonResponse(['error' => 'Sitter profile not found'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($this->mapSitter($sitter));
    }

    #[Route('/api/sitters/me', name: 'api_sitters_update', methods: ['PUT'])]
    public function updateMyProfile(
        Request $request,
        UserRepository $userRepository,
        SitterRepository $sitterRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUserFromToken($request, $userRepository);

        if (!$user || $user->getType() !== 'sitter') {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $sitter = $sitterRepository->findOneBy(['user' => $user]);

        if (!$sitter) {
            return new JsonResponse(['error' => 'Sitter profile not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse(['error' => 'Invalid payload'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['bio'])) {
            $sitter->setBio(trim((string) $data['bio']) ?: null);
        }

        if (array_key_exists('services', $data)) {
            if (is_array($data['services'])) {
                $cleaned = array_values(array_filter(array_map(static function ($service) {
                    return is_string($service) ? trim($service) : null;
                }, $data['services'])));
                $sitter->setServices($cleaned);
            } else {
                return new JsonResponse(['error' => 'services must be an array of strings'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('price_per_hour', $data)) {
            $price = $data['price_per_hour'];
            if ($price === null || $price === '') {
                $sitter->setPricePerHour(null);
            } elseif (is_numeric($price)) {
                $normalizedPrice = number_format((float) $price, 2, '.', '');
                $sitter->setPricePerHour($normalizedPrice);
            } else {
                return new JsonResponse(['error' => 'price_per_hour must be numeric'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('is_available', $data)) {
            $availability = filter_var($data['is_available'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($availability === null) {
                return new JsonResponse(['error' => 'is_available must be a boolean'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setIsAvailable($availability);
        }

        if (array_key_exists('experience_years', $data)) {
            if ($data['experience_years'] === null || $data['experience_years'] === '') {
                $sitter->setExperienceYears(null);
            } elseif (is_numeric($data['experience_years'])) {
                $years = (int) $data['experience_years'];
                if ($years < 0) {
                    return new JsonResponse(['error' => 'experience_years must be positive'], Response::HTTP_BAD_REQUEST);
                }
                $sitter->setExperienceYears($years);
            } else {
                return new JsonResponse(['error' => 'experience_years must be numeric'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('ville', $data)) {
            $city = trim((string) $data['ville']);
            if ($city === '') {
                return new JsonResponse(['error' => 'ville cannot be empty'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setVille($city);
        }

        if (array_key_exists('telephone', $data)) {
            $phone = preg_replace('/\s+/', '', (string) $data['telephone']);
            if (!preg_match('/^0[1-9]\d{8}$/', $phone)) {
                return new JsonResponse(['error' => 'telephone must match French format 0XXXXXXXXX'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setTelephone($phone);
        }

        // Auto-vérification : rendre le sitter visible dès que son profil est complet
        $hasCompletedProfile = $sitter->getBio() !== null
            && trim($sitter->getBio()) !== ''
            && !empty($sitter->getServices())
            && $sitter->getPricePerHour() !== null;

        if ($hasCompletedProfile && !$sitter->getIsVerified()) {
            $sitter->setIsVerified(true);
        }

        $em->flush();

        return new JsonResponse($this->mapSitter($sitter));
    }

    private function mapSitter(Sitter $sitter): array
    {
        return [
            'id' => $sitter->getId(),
            'user_id' => $sitter->getUser()->getId(),
            'nom' => $sitter->getNom(),
            'prenom' => $sitter->getPrenom(),
            'city' => $sitter->getVille(),
            'telephone' => $sitter->getTelephone(),
            'email' => $sitter->getUser()->getEmail(),
            'photo_path' => $sitter->getPhotoPath(),
            'bio' => $sitter->getBio(),
            'services' => $sitter->getServices() ?? [],
            'price_per_hour' => $sitter->getPricePerHour() !== null ? (float) $sitter->getPricePerHour() : null,
            'availability' => $sitter->isAvailable(),
            'experience_years' => $sitter->getExperienceYears(),
            'is_verified' => $sitter->getIsVerified(),
        ];
    }
}

