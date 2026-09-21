<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface  $em,
        private NotificationRepository  $notifRepo,
        private JwtService              $jwtService,
    ) {
    }


    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }


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

    #[Route('/read-all', methods: ['POST'])]
    public function readAll(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $this->notifRepo->markAllReadForUser($user);

        return $this->json(['success' => true]);
    }

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

    #[Route('', methods: ['DELETE'])]
    public function deleteAll(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $this->notifRepo->deleteAllForUser($user);

        return $this->json(['success' => true]);
    }
}
