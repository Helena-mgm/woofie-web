<?php

namespace App\Controller;

use App\Entity\Dog;
use App\Entity\Owner;
use App\Entity\User;
use App\Repository\DogRepository;
use App\Repository\OwnerRepository;
use App\Service\ImageUploadService;
use App\Service\JwtService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/dogs')]
class DogController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private DogRepository          $dogRepo,
        private OwnerRepository        $ownerRepo,
        private ImageUploadService     $imageUploadService,
        private JwtService             $jwtService,
    ) {
    }


    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }


    #[Route('/lost', methods: ['GET'])]
    public function listLost(): JsonResponse
    {
        $dogs = $this->dogRepo->findBy(['isLost' => true], ['lostSince' => 'DESC']);
        return $this->json(array_map(fn(Dog $d) => $d->toPublicArray(), $dogs));
    }


    #[Route('/mine', methods: ['GET'])]
    public function mine(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner) return $this->json([], 200);

        return $this->json(array_map(
            fn(Dog $d) => $d->toArray(),
            $owner->getDogs()->toArray()
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner) return $this->json(['error' => 'Profil propriétaire introuvable'], 404);

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }

        foreach (['name', 'icadNumber', 'icadType'] as $field) {
            if (!is_string($data[$field] ?? null) || trim($data[$field]) === '') {
                return $this->json(['error' => "Le champ '{$field}' est obligatoire"], 400);
            }
        }

        $name = trim($data['name']);
        $icadNumber = strtoupper(preg_replace('/\s+/', '', trim($data['icadNumber'])) ?? '');
        $icadType = $data['icadType'];
        $expectedIcadType = ctype_digit($icadNumber) && strlen($icadNumber) === 15 ? 'microchip' : 'tattoo';

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return $this->json(['error' => 'Le nom doit contenir entre 2 et 100 caractères'], 400);
        }
        if (preg_match('/^(?:\d{15}|[A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/', $icadNumber) !== 1 || $icadType !== $expectedIcadType) {
            return $this->json(['error' => 'Numéro ou type ICAD invalide'], 400);
        }
        if ($this->dogRepo->findOneBy(['icadNumber' => $icadNumber])) {
            return $this->json(['error' => 'Ce numéro ICAD est déjà enregistré'], 409);
        }

        $dog = (new Dog())
            ->setNom($name)
            ->setIcadNumber($icadNumber)
            ->setIcadType($icadType)
            ->setOwner($owner);

        $optionalError = $this->applyOptionalFields($dog, $data);
        if ($optionalError) {
            return $optionalError;
        }

        $uploadedPath = null;
        try {
            if (array_key_exists('photo', $data) && $data['photo'] !== '') {
                if (!is_string($data['photo'])) {
                    return $this->json(['error' => 'Photo invalide'], 400);
                }
                $uploadedPath = $this->saveBase64Photo($data['photo']);
                $dog->setPhotoPath($uploadedPath);
            }

            $this->em->persist($dog);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            $this->removeUploadedFile($uploadedPath);
            return $this->json(['error' => 'Ce numéro ICAD est déjà enregistré'], 409);
        } catch (\RuntimeException) {
            $this->removeUploadedFile($uploadedPath);
            return $this->json(['error' => 'Photo invalide'], 400);
        } catch (\Throwable $exception) {
            $this->removeUploadedFile($uploadedPath);
            error_log('[DogController::create] ' . $exception::class);
            return $this->json(['error' => 'Création du chien impossible'], 500);
        }

        return $this->json($dog->toArray(), 201);
    }

    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $dog = $this->dogRepo->find($id);
        if (!$dog) return $this->json(['error' => 'Chien introuvable'], 404);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner || $dog->getOwner()?->getId() !== $owner->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }

        if (array_key_exists('name', $data)) {
            $name = is_string($data['name']) ? trim($data['name']) : '';
            if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
                return $this->json(['error' => 'Le nom doit contenir entre 2 et 100 caractères'], 400);
            }
            $dog->setNom($name);
        }

        $optionalError = $this->applyOptionalFields($dog, $data);
        if ($optionalError) {
            return $optionalError;
        }

        $oldPhotoPath = $dog->getPhotoPath();
        $uploadedPath = null;
        try {
            if (array_key_exists('photo', $data) && $data['photo'] !== '') {
                if (!is_string($data['photo'])) {
                    return $this->json(['error' => 'Photo invalide'], 400);
                }
                $uploadedPath = $this->saveBase64Photo($data['photo']);
                $dog->setPhotoPath($uploadedPath);
            }

            $this->em->flush();
        } catch (\RuntimeException) {
            $this->removeUploadedFile($uploadedPath);
            return $this->json(['error' => 'Photo invalide'], 400);
        } catch (\Throwable $exception) {
            $this->removeUploadedFile($uploadedPath);
            error_log('[DogController::update] ' . $exception::class);
            return $this->json(['error' => 'Modification du chien impossible'], 500);
        }

        if ($uploadedPath !== null && $oldPhotoPath !== $uploadedPath) {
            $this->removeUploadedFile($oldPhotoPath);
        }

        return $this->json($dog->toArray());
    }

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $dog = $this->dogRepo->find($id);
        if (!$dog) return $this->json(['error' => 'Chien introuvable'], 404);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner || $dog->getOwner()?->getId() !== $owner->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $photoPaths = [$dog->getPhotoPath()];
        foreach ($dog->getPhotos() as $photo) {
            $photoPaths[] = $photo->getPhotoPath();
        }

        $this->em->remove($dog);
        $this->em->flush();
        foreach ($photoPaths as $photoPath) {
            $this->removeUploadedFile($photoPath);
        }

        return $this->json(['success' => true]);
    }


    #[Route('/{id}/lost', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function markLost(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $dog = $this->dogRepo->find($id);
        if (!$dog) return $this->json(['error' => 'Chien introuvable'], 404);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner || $dog->getOwner()?->getId() !== $owner->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }

        $location = $this->optionalString($data['location'] ?? null, 255);
        $contact = $this->optionalString($data['contact'] ?? null, 255);
        $description = $this->optionalString($data['description'] ?? null, 2000);
        if ($location === false || $contact === false || $description === false) {
            return $this->json(['error' => 'Données de signalement invalides'], 400);
        }

        $lat = $this->coordinate($data, 'lat', -90, 90);
        $lng = $this->coordinate($data, 'lng', -180, 180);
        if ($lat === false || $lng === false) {
            return $this->json(['error' => 'Coordonnées invalides'], 400);
        }

        $dog->setIsLost(true)
            ->setLostSince(new \DateTime())
            ->setLostLocation($location)
            ->setLostLat($lat)
            ->setLostLng($lng)
            ->setLostContact($contact ?? $user->getEmail())
            ->setLostDescription($description);

        $this->em->flush();

        return $this->json($dog->toArray());
    }

    #[Route('/{id}/found', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function markFound(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $dog = $this->dogRepo->find($id);
        if (!$dog) return $this->json(['error' => 'Chien introuvable'], 404);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner || $dog->getOwner()?->getId() !== $owner->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $dog->setIsLost(false)
            ->setLostSince(null)
            ->setLostLocation(null)
            ->setLostLat(null)
            ->setLostLng(null)
            ->setLostContact(null)
            ->setLostDescription(null);

        $this->em->flush();

        return $this->json($dog->toArray());
    }


    private function saveBase64Photo(string $base64): string
    {
        $dir = $this->getParameter('kernel.project_dir') . '/public/uploads/dogs';
        return $this->imageUploadService->storeBase64Image($base64, $dir, '/uploads/dogs');
    }

    private function applyOptionalFields(Dog $dog, array $data): ?JsonResponse
    {
        foreach (['race' => 50, 'taille' => 20, 'description' => 2000] as $field => $maxLength) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            $value = $this->optionalString($data[$field], $maxLength);
            if ($value === false) {
                return $this->json(['error' => "Le champ '{$field}' est invalide"], 400);
            }

            match ($field) {
                'race' => $dog->setRace($value),
                'taille' => $dog->setTaille($value),
                'description' => $dog->setDescription($value),
            };
        }

        if (array_key_exists('sexe', $data)) {
            $sex = $data['sexe'] === '' || $data['sexe'] === null ? null : $data['sexe'];
            if ($sex !== null && !in_array($sex, ['M', 'F'], true)) {
                return $this->json(['error' => 'Le sexe doit être M ou F'], 400);
            }
            $dog->setSexe($sex);
        }

        if (array_key_exists('dateNaissance', $data)) {
            if ($data['dateNaissance'] === '' || $data['dateNaissance'] === null) {
                $dog->setDateNaissance(null);
            } elseif (!is_string($data['dateNaissance'])) {
                return $this->json(['error' => 'Date de naissance invalide'], 400);
            } else {
                $date = \DateTime::createFromFormat('!Y-m-d', $data['dateNaissance']);
                $dateErrors = \DateTime::getLastErrors();
                if (!$date || ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) || $date->format('Y-m-d') !== $data['dateNaissance'] || $date > new \DateTimeImmutable('today')) {
                    return $this->json(['error' => 'Date de naissance invalide'], 400);
                }
                $dog->setDateNaissance($date);
            }
        }

        return null;
    }

    private function optionalString(mixed $value, int $maxLength): string|false|null
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value)) {
            return false;
        }

        $value = trim($value);
        return $value !== '' && mb_strlen($value) <= $maxLength ? $value : false;
    }

    private function coordinate(array $data, string $field, float $min, float $max): float|false|null
    {
        if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
            return null;
        }
        if (!is_numeric($data[$field])) {
            return false;
        }

        $value = (float) $data[$field];
        return is_finite($value) && $value >= $min && $value <= $max ? $value : false;
    }

    private function removeUploadedFile(?string $path): void
    {
        if ($path !== null && str_starts_with($path, '/uploads/dogs/')) {
            @unlink((string) $this->getParameter('kernel.project_dir') . '/public' . $path);
        }
    }
}
