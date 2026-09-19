<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Sitter;
use App\Entity\Dog;
use App\Entity\Event;
use App\Entity\ForbiddenKeyword;
use App\Repository\UserRepository;
use App\Repository\SitterRepository;
use App\Repository\ForbiddenKeywordRepository;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    public function __construct(private JwtService $jwtService)
    {
    }

    private function requireAdmin(Request $request): ?User
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return null;
        }

        if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return null;
        }

        return $user;
    }

    #[Route('/stats', methods: ['GET'])]
    public function stats(
        Request $request,
        UserRepository $userRepo,
        SitterRepository $sitterRepo,
        ForbiddenKeywordRepository $forbiddenRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $users = $userRepo->findAll();

        return $this->json([
            'users_total' => count($users),
            'owners_total' => count(array_filter($users, static fn (User $u) => $u->getType() === 'owner')),
            'sitters_total' => count(array_filter($users, static fn (User $u) => $u->getType() === 'sitter')),
            'banned_total' => count(array_filter($users, static fn (User $u) => $u->isBanned())),
            'admins_total' => count(array_filter($users, static fn (User $u) => $u->isAdmin())),
            'sitters_pending' => count($sitterRepo->findPending()),
            'sitters_verified' => count($sitterRepo->findVerified()),
            'dogs_total' => count($em->getRepository(Dog::class)->findAll()),
            'dogs_lost' => count($em->getRepository(Dog::class)->findBy(['isLost' => true])),
            'posts_total' => count($em->getRepository(\App\Entity\Post::class)->findAll()),
            'events_total' => count($em->getRepository(Event::class)->findAll()),
            'events_private' => count($em->getRepository(Event::class)->findBy(['isPrivate' => true])),
            'forbidden_keywords_total' => count($forbiddenRepo->getAllKeywords()),
        ]);
    }

    #[Route('/users', methods: ['GET'])]
    public function listUsers(Request $request, UserRepository $userRepo, SitterRepository $sitterRepo): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $query = mb_strtolower(trim((string) $request->query->get('q', '')));
        $type = $request->query->get('type');
        $status = $request->query->get('status');

        $sittersByUserId = [];
        foreach ($sitterRepo->findAll() as $sitter) {
            $sittersByUserId[$sitter->getUser()->getId()] = $sitter;
        }

        $data = [];
        foreach ($userRepo->findAll() as $user) {
            if ($type && $user->getType() !== $type) {
                continue;
            }
            if ($status === 'banned' && !$user->isBanned()) {
                continue;
            }
            if ($status === 'admin' && !$user->isAdmin()) {
                continue;
            }

            $displayName = $user->getEmail();
            $city = null;
            $photo = null;
            $sitterId = null;
            $sitterIsVerified = null;

            if ($user->getType() === 'owner' && $user->getOwner()) {
                $displayName = $user->getOwner()->getFullName();
                $city = $user->getOwner()->getVille();
                $photo = $user->getOwner()->getPhotoPath();
            } elseif ($user->getType() === 'sitter' && isset($sittersByUserId[$user->getId()])) {
                $sitter = $sittersByUserId[$user->getId()];
                $displayName = $sitter->getFullName();
                $city = $sitter->getVille();
                $photo = $sitter->getPhotoPath();
                $sitterId = $sitter->getId();
                $sitterIsVerified = $sitter->getIsVerified();
            }

            if ($query !== '' && !str_contains(mb_strtolower($displayName), $query) && !str_contains(mb_strtolower($user->getEmail()), $query)) {
                continue;
            }

            $data[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'type' => $user->getType(),
                'name' => $displayName,
                'city' => $city,
                'photo_path' => $photo,
                'roles' => $user->getRoles(),
                'is_admin' => $user->isAdmin(),
                'is_banned' => $user->isBanned(),
                'is_verified' => $user->isVerified(),
                'sitter_id' => $sitterId,
                'sitter_is_verified' => $sitterIsVerified,
            ];
        }

        return $this->json($data);
    }

    #[Route('/users/{id}/ban', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function banUser(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if ($target->getId() === $admin->getId()) {
            return $this->json(['error' => 'Vous ne pouvez pas vous bannir vous-même'], 409);
        }

        if (!$target->isBanned()) {
            $roles = $target->getRoles();
            $roles[] = 'ROLE_BANNED';
            $target->setRoles(array_values(array_unique($roles)));
            $em->flush();
        }

        return $this->json(['success' => true, 'is_banned' => $target->isBanned()]);
    }

    #[Route('/users/{id}/unban', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function unbanUser(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $roles = array_values(array_filter($target->getRoles(), static fn (string $role) => $role !== 'ROLE_BANNED'));
        $target->setRoles($roles);
        $em->flush();

        return $this->json(['success' => true, 'is_banned' => $target->isBanned()]);
    }

    #[Route('/sitters', methods: ['GET'])]
    public function listSitters(Request $request, SitterRepository $sitterRepo): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $status = (string) $request->query->get('status', 'all');
        $sitters = match ($status) {
            'pending' => $sitterRepo->findPending(),
            'verified' => $sitterRepo->findVerified(),
            default => $sitterRepo->findAll(),
        };

        $data = array_map(static function (Sitter $sitter): array {
            return [
                'id' => $sitter->getId(),
                'user_id' => $sitter->getUser()->getId(),
                'email' => $sitter->getUser()->getEmail(),
                'name' => $sitter->getFullName(),
                'city' => $sitter->getVille(),
                'siret' => $sitter->getSiret(),
                'photo_path' => $sitter->getPhotoPath(),
                'bio' => $sitter->getBio(),
                'services' => $sitter->getServices() ?? [],
                'price_per_hour' => $sitter->getPricePerHour() !== null ? (float) $sitter->getPricePerHour() : null,
                'is_available' => $sitter->isAvailable(),
                'is_verified' => $sitter->getIsVerified(),
                'is_banned' => $sitter->getUser()->isBanned(),
                'created_at' => $sitter->getCreatedAt()->format('c'),
                'verified_at' => $sitter->getVerifiedAt()?->format('c'),
            ];
        }, $sitters);

        return $this->json(array_values($data));
    }

    #[Route('/events', methods: ['GET'])]
    public function listEvents(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $events = $em->getRepository(Event::class)->findBy([], ['date' => 'DESC']);
        $data = array_map(static fn (Event $event) => $event->toArray($admin), $events);

        return $this->json($data);
    }

    #[Route('/dogs', methods: ['GET'])]
    public function listDogs(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $dogs = $em->getRepository(Dog::class)->findBy([], ['id' => 'DESC']);
        $data = array_map(static function (Dog $dog): array {
            return [
                'id' => $dog->getId(),
                'nom' => $dog->getNom(),
                'race' => $dog->getRace(),
                'sexe' => $dog->getSexe(),
                'photo_path' => $dog->getPhotoPath(),
                'is_lost' => $dog->isLost(),
                'owner_id' => $dog->getOwner()?->getId(),
                'owner_name' => $dog->getOwner()?->getFullName(),
                'created_at' => $dog->getCreatedAt()->format('c'),
            ];
        }, $dogs);

        return $this->json($data);
    }

    #[Route('/users/{id}/role', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function changeUserRole(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $roles = is_array($data) ? ($data['roles'] ?? null) : null;
        if (!is_array($roles)) {
            return $this->json(['error' => 'roles must be array'], 400);
        }

        $allowedRoles = ['ROLE_USER', 'ROLE_ADMIN'];
        if (count($roles) > count($allowedRoles) || array_filter($roles, static fn(mixed $role): bool => !is_string($role) || !in_array($role, $allowedRoles, true))) {
            return $this->json(['error' => 'Unsupported role'], 400);
        }

        $roles = array_values(array_unique($roles));
        if ($target->getId() === $admin->getId() && !in_array('ROLE_ADMIN', $roles, true)) {
            return $this->json(['error' => 'An administrator cannot revoke their own access'], 409);
        }

        $target->setRoles($roles);
        $em->flush();

        return $this->json(['success' => true, 'roles' => $target->getRoles()]);
    }

    #[Route('/users/{id}/verify', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function verifyUser(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $isVerified = is_array($data) ? ($data['is_verified'] ?? true) : null;
        if (!is_bool($isVerified)) {
            return $this->json(['error' => 'is_verified must be boolean'], 400);
        }
        $target->setIsVerified($isVerified);
        $em->flush();

        return $this->json(['success' => true, 'is_verified' => $target->isVerified()]);
    }

    #[Route('/sitters/{id}/verify', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function verifySitter(int $id, Request $request, SitterRepository $sitterRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $sitter = $sitterRepo->find($id);
        if (!$sitter) {
            return $this->json(['error' => 'Sitter not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $isVerified = is_array($data) ? ($data['is_verified'] ?? true) : null;
        if (!is_bool($isVerified)) {
            return $this->json(['error' => 'is_verified must be boolean'], 400);
        }
        $sitter->setIsVerified($isVerified);
        $sitter->setVerifiedAt($isVerified ? new \DateTimeImmutable() : null);
        $em->flush();

        return $this->json(['success' => true, 'is_verified' => $sitter->getIsVerified()]);
    }

    #[Route('/forbidden_keywords', methods: ['GET'])]
    public function listKeywords(Request $request, ForbiddenKeywordRepository $forbiddenRepo): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $keywords = array_map(
            static fn (ForbiddenKeyword $k): array => ['id' => $k->getId(), 'keyword' => $k->getKeyword()],
            $forbiddenRepo->findBy([], ['keyword' => 'ASC'])
        );

        return $this->json(['keywords' => $keywords]);
    }

    #[Route('/forbidden_keywords', methods: ['POST'])]
    public function addKeyword(Request $request, ForbiddenKeywordRepository $forbiddenRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $kw = is_array($data) && is_string($data['keyword'] ?? null)
            ? mb_strtolower(trim($data['keyword']))
            : '';
        if ($kw === '' || mb_strlen($kw) > 255) {
            return $this->json(['error' => 'keyword is required'], 400);
        }

        $existing = $em->getRepository(ForbiddenKeyword::class)->findOneBy(['keyword' => $kw]);
        if ($existing) {
            return $this->json(['error' => 'keyword exists'], 400);
        }

        $k = new ForbiddenKeyword();
        $k->setKeyword($kw);
        $em->persist($k);
        $em->flush();

        return $this->json(['success' => true, 'keyword' => $kw], 201);
    }

    #[Route('/forbidden_keywords/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteKeyword(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $k = $em->getRepository(ForbiddenKeyword::class)->find($id);
        if (!$k) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $em->remove($k);
        $em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/message', methods: ['POST'])]
    public function sendMessageAsAdmin(Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $toId = is_array($data) ? filter_var($data['to'] ?? null, FILTER_VALIDATE_INT) : false;
        $content = is_array($data) && is_string($data['content'] ?? null) ? trim($data['content']) : '';
        if ($toId === false || $toId < 1 || $content === '' || mb_strlen($content) > 5000) {
            return $this->json(['error' => 'to and content required'], 400);
        }

        $recipient = $userRepo->find($toId);
        if (!$recipient) {
            return $this->json(['error' => 'Recipient not found'], 404);
        }

        $convRepo = $em->getRepository(\App\Entity\Conversation::class);
        $conversation = null;
        $conversations = $convRepo->findByUser($admin);
        foreach ($conversations as $candidate) {
            if ($candidate->getType() === 'direct' && $candidate->getParticipants()->count() === 2 && $candidate->getParticipants()->contains($recipient)) {
                $conversation = $candidate;
                break;
            }
        }

        if (!$conversation) {
            $conversation = new \App\Entity\Conversation();
            $conversation->setType('direct');
            $conversation->addParticipant($admin);
            $conversation->addParticipant($recipient);
            $em->persist($conversation);
        }

        $message = new \App\Entity\Message();
        $message->setConversation($conversation);
        $message->setSender($admin);
        $message->setContent($content);
        $message->setType('text');
        $em->persist($message);
        $em->flush();

        return $this->json(['success' => true, 'id' => $message->getId()], 201);
    }
}
