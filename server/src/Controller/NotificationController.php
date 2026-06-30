<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface  $em,
        private NotificationRepository  $notifRepo,
        private UserRepository          $userRepo,
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

    // ── Endpoints ────────────────────────────────────────────────────────────

    /** GET /api/notifications — liste des notifs de l'utilisateur connecté */
    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $notifications = $this->notifRepo->findForUser($user, 50);
        $unreadCount   = $this->notifRepo->countUnread($user);

        return $this->json([
            'notifications' => array_map(fn(Notification $n) => $n->toArray(), $notifications),
            'unreadCount'   => $unreadCount,
        ]);
    }

    /** POST /api/notifications/read-all — marquer toutes les notifs comme lues */
    #[Route('/read-all', methods: ['POST'])]
    public function readAll(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $this->notifRepo->markAllReadForUser($user);

        return $this->json(['success' => true]);
    }

    /** POST /api/notifications/{id}/read — marquer une notif comme lue */
    #[Route('/{id}/read', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function read(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $notif = $this->notifRepo->find($id);
        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Notification introuvable'], 404);
        }

        $notif->setIsRead(true);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    /** DELETE /api/notifications/{id} — supprimer une notif */
    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $notif = $this->notifRepo->find($id);
        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Notification introuvable'], 404);
        }

        $this->em->remove($notif);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    /** DELETE /api/notifications — supprimer toutes les notifs de l'utilisateur */
    #[Route('', methods: ['DELETE'])]
    public function deleteAll(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $this->notifRepo->deleteAllForUser($user);

        return $this->json(['success' => true]);
    }
}
