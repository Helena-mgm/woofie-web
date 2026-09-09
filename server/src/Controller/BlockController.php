<?php

namespace App\Controller;

use App\Entity\BlockedUser;
use App\Entity\User;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/users')]
class BlockController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private JwtService $jwtService
    ) {
    }

    #[Route('/blocked', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $blocked = $this->em->getRepository(BlockedUser::class)
            ->findBy(['user' => $user]);

        $data = array_map(fn($b) => [
            'userId' => $b->getBlockedUser()->getId(),
            'blockedAt' => $b->getBlockedAt()->format('c'),
        ], $blocked);

        return $this->json($data);
    }

    #[Route('/{id}/block', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function block(User $blockedUser, Request $request): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        if ($blockedUser->getId() === $user->getId()) {
            return $this->json(['error' => 'Cannot block yourself'], 400);
        }

        $existing = $this->em->getRepository(BlockedUser::class)
            ->findOneBy(['user' => $user, 'blockedUser' => $blockedUser]);

        if ($existing) {
            return $this->json(['message' => 'Already blocked']);
        }

        $block = new BlockedUser();
        $block->setUser($user);
        $block->setBlockedUser($blockedUser);

        $this->em->persist($block);
        $this->em->flush();

        return $this->json(['success' => true], 201);
    }

    #[Route('/{id}/block', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function unblock(User $blockedUser, Request $request): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $block = $this->em->getRepository(BlockedUser::class)
            ->findOneBy(['user' => $user, 'blockedUser' => $blockedUser]);

        if ($block) {
            $this->em->remove($block);
            $this->em->flush();
        }

        return $this->json(['success' => true]);
    }
}
