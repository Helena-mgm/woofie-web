<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Sitter;
use App\Entity\ForbiddenKeyword;
use App\Repository\UserRepository;
use App\Repository\SitterRepository;
use App\Repository\ForbiddenKeywordRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    private string $jwtKey;

    public function __construct()
    {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function decodeToken(Request $request): ?object
    {
        $authHeader = $request->headers->get('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);

        try {
            return JWT::decode($token, new Key($this->jwtKey, 'HS256'));
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function requireAdmin(Request $request, UserRepository $userRepo): ?User
    {
        $decoded = $this->decodeToken($request);
        if (!$decoded) {
            return null;
        }

        $user = $userRepo->find($decoded->sub);
        if (!$user) {
            return null;
        }

        if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return null;
        }

        return $user;
    }

    #[Route('/users/{id}/role', methods: ['POST'])]
    public function changeUserRole(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $roles = $data['roles'] ?? null;
        if (!is_array($roles)) {
            return $this->json(['error' => 'roles must be array'], 400);
        }

        $target->setRoles($roles);
        $em->flush();

        return $this->json(['success' => true, 'roles' => $target->getRoles()]);
    }

    #[Route('/users/{id}/verify', methods: ['POST'])]
    public function verifyUser(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $target = $userRepo->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $isVerified = filter_var($data['is_verified'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $target->setIsVerified((bool)$isVerified);
        $em->flush();

        return $this->json(['success' => true, 'is_verified' => $target->isVerified()]);
    }

    #[Route('/sitters/{id}/verify', methods: ['POST'])]
    public function verifySitter(int $id, Request $request, UserRepository $userRepo, SitterRepository $sitterRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $sitter = $sitterRepo->find($id);
        if (!$sitter) {
            return $this->json(['error' => 'Sitter not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $isVerified = filter_var($data['is_verified'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $sitter->setIsVerified((bool)$isVerified);
        $sitter->setVerifiedAt($isVerified ? new \DateTimeImmutable() : null);
        $em->flush();

        return $this->json(['success' => true, 'is_verified' => $sitter->getIsVerified()]);
    }

    #[Route('/forbidden_keywords', methods: ['GET'])]
    public function listKeywords(Request $request, UserRepository $userRepo, ForbiddenKeywordRepository $forbiddenRepo): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        return $this->json(['keywords' => $forbiddenRepo->getAllKeywords()]);
    }

    #[Route('/forbidden_keywords', methods: ['POST'])]
    public function addKeyword(Request $request, UserRepository $userRepo, ForbiddenKeywordRepository $forbiddenRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $kw = trim((string)($data['keyword'] ?? ''));
        if ($kw === '') {
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

    #[Route('/forbidden_keywords/{id}', methods: ['DELETE'])]
    public function deleteKeyword(int $id, Request $request, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->requireAdmin($request, $userRepo);
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
        $admin = $this->requireAdmin($request, $userRepo);
        if (!$admin) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $toId = $data['to'] ?? null;
        $content = trim((string)($data['content'] ?? ''));
        if (!$toId || $content === '') {
            return $this->json(['error' => 'to and content required'], 400);
        }

        $recipient = $userRepo->find($toId);
        if (!$recipient) {
            return $this->json(['error' => 'Recipient not found'], 404);
        }

        // Create or reuse a direct conversation
        $convRepo = $em->getRepository(\App\Entity\Conversation::class);
        $conversation = null;
        if ($convRepo) {
            $conversations = $convRepo->findByUser($admin);
            foreach ($conversations as $c) {
                if ($c->getType() === 'direct' && $c->getParticipants()->contains($recipient)) {
                    $conversation = $c;
                    break;
                }
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
