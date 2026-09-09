<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Sitter;
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

        return $this->json(['keywords' => $forbiddenRepo->getAllKeywords()]);
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
