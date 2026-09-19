<?php

namespace App\Controller;

use App\Entity\Sitter;
use App\Entity\User;
use App\Repository\SitterRepository;
use App\Repository\OwnerRepository;
use App\Service\JwtService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SitterController extends AbstractController
{
    public function __construct(private JwtService $jwtService)
    {
    }

    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    #[Route('/api/sitters', name: 'api_sitters_list', methods: ['GET'])]
    public function list(Request $request, SitterRepository $repository): JsonResponse
    {
        $serviceFilter = $request->query->get('service');
        $cityFilter = $request->query->get('city');
        $availableFilter = $request->query->get('available');

        $sitters = $repository->findAll();

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

        $data = array_map(fn (Sitter $sitter) => $this->mapPublicSitter($sitter), $filtered);

        return new JsonResponse(array_values($data));
    }

    #[Route('/api/sitters/me', name: 'api_sitters_me', methods: ['GET'])]
    public function getMyProfile(
        Request $request,
        SitterRepository $sitterRepository
    ): JsonResponse {
        $user = $this->getUserFromToken($request);

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
        SitterRepository $sitterRepository,
        OwnerRepository $ownerRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUserFromToken($request);

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
            if (!is_string($data['bio'])) {
                return new JsonResponse(['error' => 'bio must be a string'], Response::HTTP_BAD_REQUEST);
            }
            $bio = trim($data['bio']);
            if (mb_strlen($bio) > 2000) {
                return new JsonResponse(['error' => 'bio is too long'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setBio($bio !== '' ? $bio : null);
        }

        if (array_key_exists('services', $data)) {
            if (is_array($data['services'])) {
                if (count($data['services']) > 20) {
                    return new JsonResponse(['error' => 'services contains invalid values'], Response::HTTP_BAD_REQUEST);
                }
                $cleaned = [];
                foreach ($data['services'] as $service) {
                    if (!is_string($service)) {
                        return new JsonResponse(['error' => 'services contains invalid values'], Response::HTTP_BAD_REQUEST);
                    }
                    $service = trim($service);
                    if ($service === '' || mb_strlen($service) > 100) {
                        return new JsonResponse(['error' => 'services contains invalid values'], Response::HTTP_BAD_REQUEST);
                    }
                    $cleaned[] = $service;
                }
                $sitter->setServices(array_values(array_unique($cleaned)));
            } else {
                return new JsonResponse(['error' => 'services must be an array of strings'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('price_per_hour', $data)) {
            $price = $data['price_per_hour'];
            if ($price === null || $price === '') {
                $sitter->setPricePerHour(null);
            } elseif (is_numeric($price)) {
                $numericPrice = (float) $price;
                if (!is_finite($numericPrice) || $numericPrice < 0 || $numericPrice > 99999.99) {
                    return new JsonResponse(['error' => 'price_per_hour is out of range'], Response::HTTP_BAD_REQUEST);
                }
                $normalizedPrice = number_format($numericPrice, 2, '.', '');
                $sitter->setPricePerHour($normalizedPrice);
            } else {
                return new JsonResponse(['error' => 'price_per_hour must be numeric'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('is_available', $data)) {
            if (!is_bool($data['is_available'])) {
                return new JsonResponse(['error' => 'is_available must be a boolean'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setIsAvailable($data['is_available']);
        }

        if (array_key_exists('experience_years', $data)) {
            if ($data['experience_years'] === null || $data['experience_years'] === '') {
                $sitter->setExperienceYears(null);
            } else {
                $years = filter_var($data['experience_years'], FILTER_VALIDATE_INT);
                if ($years === false || $years < 0 || $years > 100) {
                    return new JsonResponse(['error' => 'experience_years must be an integer between 0 and 100'], Response::HTTP_BAD_REQUEST);
                }
                $sitter->setExperienceYears($years);
            }
        }

        if (array_key_exists('ville', $data)) {
            if (!is_string($data['ville'])) {
                return new JsonResponse(['error' => 'ville must be a string'], Response::HTTP_BAD_REQUEST);
            }
            $city = trim($data['ville']);
            if (mb_strlen($city) < 2 || mb_strlen($city) > 100) {
                return new JsonResponse(['error' => 'ville must contain between 2 and 100 characters'], Response::HTTP_BAD_REQUEST);
            }
            $sitter->setVille($city);
        }

        if (array_key_exists('telephone', $data)) {
            if (!is_string($data['telephone'])) {
                return new JsonResponse(['error' => 'telephone must be a string'], Response::HTTP_BAD_REQUEST);
            }
            $phone = preg_replace('/\s+/', '', $data['telephone']);
            if (!preg_match('/^0[1-9]\d{8}$/', $phone)) {
                return new JsonResponse(['error' => 'telephone must match French format 0XXXXXXXXX'], Response::HTTP_BAD_REQUEST);
            }
            $existingSitter = $sitterRepository->findOneBy(['telephone' => $phone]);
            if (($existingSitter && $existingSitter->getId() !== $sitter->getId()) || $ownerRepository->findOneBy(['telephone' => $phone])) {
                return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], Response::HTTP_CONFLICT);
            }
            $sitter->setTelephone($phone);
        }

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            return new JsonResponse(['error' => 'Une donnée unique est déjà utilisée'], Response::HTTP_CONFLICT);
        }

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

    private function mapPublicSitter(Sitter $sitter): array
    {
        return [
            'id' => $sitter->getId(),
            'user_id' => $sitter->getUser()->getId(),
            'nom' => $sitter->getNom(),
            'prenom' => $sitter->getPrenom(),
            'city' => $sitter->getVille(),
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
