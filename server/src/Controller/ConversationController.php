<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/conversations')]
class ConversationController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface $em,
        private ConversationRepository $conversationRepo,
        private UserRepository $userRepo
    ) {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function getUserFromToken(Request $request): ?User
    {
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        try {
            $decoded = JWT::decode(substr($authHeader, 7), new Key($this->jwtKey, 'HS256'));
            return $this->userRepo->find($decoded->sub);
        } catch (\Exception $e) {
            error_log("[ConversationController] JWT error: " . $e->getMessage());
            return null;
        }
    }

    /** Serialize a participant user into the shape the frontend expects */
    private function serializeParticipant(User $p): array
    {
        $owner = $p->getOwner();
        $sitter = null;
        if ($p->getType() === 'sitter') {
            $sitter = $this->em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $p]);
        }
        return [
            'id' => $p->getId(),
            'name' => $owner
                ? trim($owner->getPrenom() . ' ' . $owner->getNom())
                : ($sitter ? trim($sitter->getPrenom() . ' ' . $sitter->getNom()) : $p->getEmail()),
            'avatar' => $owner ? $owner->getPhotoPath() : ($sitter ? $sitter->getPhotoPath() : null),
            'isOnline' => false,
            'isAdmin' => $p->isAdmin(),
            'isVerified' => $p->isVerified(),
            'type' => $p->getType(),
        ];
    }

    /** Serialize a conversation with its last message and real unread count */
    private function serializeConversation(Conversation $conv, User $currentUser): array
    {
        $lastMsg = $conv->getLastMessage();
        $unread = $this->conversationRepo->getUnreadCount($conv, $currentUser);

        return [
            'id' => $conv->getId(),
            'type' => $conv->getType(),
            'name' => $conv->getName(),
            'avatar' => $conv->getAvatar(),
            'participants' => array_map(
                fn($p) => $this->serializeParticipant($p),
                $conv->getParticipants()->toArray()
            ),
            'lastMessage' => $lastMsg ? [
                'id' => $lastMsg->getId(),
                'content' => $lastMsg->getType() === 'system'
                    ? $lastMsg->getContent()
                    : (mb_strlen($lastMsg->getContent()) > 60
                        ? mb_substr($lastMsg->getContent(), 0, 57) . '…'
                        : $lastMsg->getContent()),
                'type' => $lastMsg->getType(),
                'senderId' => $lastMsg->getSender()?->getId(),
                'createdAt' => $lastMsg->getCreatedAt()->format('c'),
            ] : null,
            'unreadCount' => (int) $unread,
            'createdAt' => $conv->getCreatedAt()->format('c'),
        ];
    }

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $conversations = $this->conversationRepo->findByUser($user);
        $data = array_map(fn($c) => $this->serializeConversation($c, $user), $conversations);
        return $this->json($data);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $data = json_decode($request->getContent(), true);

        $conversation = new Conversation();
        $conversation->setType($data['type'] ?? 'direct');
        $conversation->setName($data['name'] ?? null);
        $conversation->addParticipant($user);

        if (isset($data['participantIds'])) {
            foreach ($data['participantIds'] as $participantId) {
                $participant = $this->userRepo->find($participantId);
                if ($participant && !$conversation->getParticipants()->contains($participant)) {
                    $conversation->addParticipant($participant);
                }
            }
        }

        $this->em->persist($conversation);

        // System message: group created
        if ($conversation->getType() === 'group') {
            $owner = $user->getOwner();
            $sitter = $this->em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $user]);
            $displayName = $owner ? $owner->getFullName() : ($sitter ? trim($sitter->getPrenom() . ' ' . $sitter->getNom()) : $user->getEmail());
            $sysMsg = new Message();
            $sysMsg->setConversation($conversation);
            $sysMsg->setSender(null);
            $sysMsg->setContent("🏠 Groupe créé par {$displayName}");
            $sysMsg->setType('system');
            $this->em->persist($sysMsg);
        }

        $this->em->flush();
        return $this->json($this->serializeConversation($conversation, $user), 201);
    }

    #[Route('/{id}/participants', methods: ['GET'])]
    public function participants(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }
        if (!$conversation->getParticipants()->contains($user) && !$user->isAdmin()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }
        $data = array_map(fn($p) => $this->serializeParticipant($p), $conversation->getParticipants()->toArray());
        return $this->json($data);
    }

    #[Route('/{id}/join', methods: ['POST'])]
    public function join(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }
        if ($conversation->getType() !== 'group') {
            return $this->json(['error' => 'Seulement pour les groupes'], 400);
        }
        if (!$conversation->getParticipants()->contains($user)) {
            $conversation->addParticipant($user);

            $owner = $user->getOwner();
            $sitter = $this->em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $user]);
            $displayName = $owner ? $owner->getFullName() : ($sitter ? trim($sitter->getPrenom() . ' ' . $sitter->getNom()) : $user->getEmail());

            $sysMsg = new Message();
            $sysMsg->setConversation($conversation);
            $sysMsg->setSender(null);
            $sysMsg->setContent("➕ {$displayName} a rejoint le groupe");
            $sysMsg->setType('system');
            $this->em->persist($sysMsg);
            $this->em->flush();
        }
        return $this->json($this->serializeConversation($conversation, $user));
    }

    #[Route('/{id}/leave', methods: ['POST'])]
    public function leave(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }
        if ($conversation->getType() !== 'group') {
            return $this->json(['error' => 'Seulement pour les groupes'], 400);
        }
        if ($conversation->getParticipants()->contains($user)) {
            $conversation->removeParticipant($user);

            $owner = $user->getOwner();
            $sitter = $this->em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $user]);
            $displayName = $owner ? $owner->getFullName() : ($sitter ? trim($sitter->getPrenom() . ' ' . $sitter->getNom()) : $user->getEmail());

            $sysMsg = new Message();
            $sysMsg->setConversation($conversation);
            $sysMsg->setSender(null);
            $sysMsg->setContent("👋 {$displayName} a quitté le groupe");
            $sysMsg->setType('system');
            $this->em->persist($sysMsg);
            $this->em->flush();
        }
        return $this->json(['success' => true]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }
        if (!$conversation->getParticipants()->contains($user) && !$user->isAdmin()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }
        $this->em->remove($conversation);
        $this->em->flush();
        return $this->json(['success' => true]);
    }
}
