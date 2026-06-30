<?php

namespace App\Controller;

use App\Entity\Dog;
use App\Entity\Owner;
use App\Entity\User;
use App\Repository\DogRepository;
use App\Repository\OwnerRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/dogs')]
class DogController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface $em,
        private DogRepository          $dogRepo,
        private OwnerRepository        $ownerRepo,
        private UserRepository         $userRepo,
    ) {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    // ── Auth helper ──────────────────────────────────────────────────────────

    private function getUserFromToken(Request $request): ?User
    {
        $header = $request->headers->get('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) return null;
        try {
            $decoded = JWT::decode(substr($header, 7), new Key($this->jwtKey, 'HS256'));
            return isset($decoded->sub) ? $this->userRepo->find((int) $decoded->sub) : null;
        } catch (\Exception) {
            return null;
        }
    }

    // ── Chiens perdus (public) ───────────────────────────────────────────────

    /** GET /api/dogs/lost — liste publique des chiens perdus */
    #[Route('/lost', methods: ['GET'])]
    public function listLost(): JsonResponse
    {
        $dogs = $this->dogRepo->findBy(['isLost' => true], ['lostSince' => 'DESC']);
        return $this->json(array_map(fn(Dog $d) => $d->toArray(), $dogs));
    }

    // ── CRUD chiens (authentifié, propriétaire) ──────────────────────────────

    /** GET /api/dogs/mine — mes chiens */
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

    /** POST /api/dogs — créer un chien */
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $owner = $this->ownerRepo->findOneBy(['user' => $user]);
        if (!$owner) return $this->json(['error' => 'Profil propriétaire introuvable'], 404);

        $data = json_decode($request->getContent(), true) ?? [];

        foreach (['name', 'icadNumber', 'icadType'] as $field) {
            if (empty($data[$field])) {
                return $this->json(['error' => "Le champ '{$field}' est obligatoire"], 400);
            }
        }

        // Vérifier unicité ICAD
        if ($this->dogRepo->findOneBy(['icadNumber' => $data['icadNumber']])) {
            return $this->json(['error' => 'Ce numéro ICAD est déjà enregistré'], 409);
        }

        $dog = (new Dog())
            ->setNom(trim($data['name']))
            ->setIcadNumber(trim($data['icadNumber']))
            ->setIcadType($data['icadType'])
            ->setOwner($owner);

        if (!empty($data['race']))          $dog->setRace($data['race']);
        if (!empty($data['taille']))        $dog->setTaille($data['taille']);
        if (!empty($data['sexe']))          $dog->setSexe($data['sexe']);
        if (!empty($data['description']))   $dog->setDescription($data['description']);
        if (!empty($data['dateNaissance'])) $dog->setDateNaissance(new \DateTime($data['dateNaissance']));

        $this->em->persist($dog);
        $this->em->flush();

        // Handle photo upload if provided (base64 or multipart)
        if (!empty($data['photo'])) {
            $photoPath = $this->saveBase64Photo($data['photo'], $dog->getId());
            if ($photoPath) {
                $dog->setPhotoPath($photoPath);
                $this->em->flush();
            }
        }

        return $this->json($dog->toArray(), 201);
    }

    /** PUT /api/dogs/{id} — modifier un chien */
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

        $data = json_decode($request->getContent(), true) ?? [];

        if (!empty($data['name']))          $dog->setNom(trim($data['name']));
        if (!empty($data['race']))          $dog->setRace($data['race']);
        if (array_key_exists('taille', $data)) $dog->setTaille($data['taille']);
        if (!empty($data['sexe']))          $dog->setSexe($data['sexe']);
        if (array_key_exists('description', $data)) $dog->setDescription($data['description']);
        if (!empty($data['dateNaissance'])) $dog->setDateNaissance(new \DateTime($data['dateNaissance']));

        if (!empty($data['photo']) && str_starts_with($data['photo'], 'data:')) {
            $photoPath = $this->saveBase64Photo($data['photo'], $dog->getId());
            if ($photoPath) $dog->setPhotoPath($photoPath);
        }

        $this->em->flush();

        return $this->json($dog->toArray());
    }

    /** DELETE /api/dogs/{id} — supprimer un chien */
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

        $this->em->remove($dog);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    // ── Alertes chien perdu ──────────────────────────────────────────────────

    /** POST /api/dogs/{id}/lost — déclarer un chien perdu */
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

        $data = json_decode($request->getContent(), true) ?? [];

        $dog->setIsLost(true)
            ->setLostSince(new \DateTime())
            ->setLostLocation($data['location'] ?? null)
            ->setLostLat(isset($data['lat']) ? (float) $data['lat'] : null)
            ->setLostLng(isset($data['lng']) ? (float) $data['lng'] : null)
            ->setLostContact($data['contact'] ?? $user->getEmail())
            ->setLostDescription($data['description'] ?? null);

        $this->em->flush();

        return $this->json($dog->toArray());
    }

    /** POST /api/dogs/{id}/found — déclarer un chien retrouvé */
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

    // ── Helper ───────────────────────────────────────────────────────────────

    private function saveBase64Photo(string $base64, int $dogId): ?string
    {
        if (!preg_match('/^data:image\/(jpeg|png|gif|webp);base64,/', $base64, $matches)) {
            return null;
        }
        $ext    = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $data   = base64_decode(substr($base64, strpos($base64, ',') + 1));
        $dir    = '/var/www/html/public/uploads/dogs';
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $filename = "dog_{$dogId}_" . time() . ".{$ext}";
        file_put_contents("{$dir}/{$filename}", $data);
        return "/uploads/dogs/{$filename}";
    }
}
