<?php

namespace App\Controller;

use App\Entity\BlockedUser;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/users')]
class BlockController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/blocked', methods: ['GET'])]
    public function index(#[CurrentUser] User $user): JsonResponse
    {
        $blocked = $this->em->getRepository(BlockedUser::class)
            ->findBy(['user' => $user]);

        $data = array_map(fn($b) => [
            'userId' => $b->getBlockedUser()->getId(),
            'blockedAt' => $b->getBlockedAt()->format('c'),
        ], $blocked);

        return $this->json($data);
    }

    #[Route('/{id}/block', methods: ['POST'])]
    public function block(User $blockedUser, #[CurrentUser] User $user): JsonResponse
    {
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

    #[Route('/{id}/block', methods: ['DELETE'])]
    public function unblock(User $blockedUser, #[CurrentUser] User $user): JsonResponse
    {
        $block = $this->em->getRepository(BlockedUser::class)
            ->findOneBy(['user' => $user, 'blockedUser' => $blockedUser]);

        if ($block) {
            $this->em->remove($block);
            $this->em->flush();
        }

        return $this->json(['success' => true]);
    }
}
