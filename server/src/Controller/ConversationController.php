<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\Group;
use App\Entity\GroupMember;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\UserRepository;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/conversations')]
class ConversationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ConversationRepository $conversationRepo,
        private UserRepository $userRepo,
        private JwtService $jwtService
    ) {
    }

    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

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
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }

        $type = $data['type'] ?? 'direct';
        if ($type !== 'direct') {
            return $this->json(['error' => 'Type de conversation invalide'], 400);
        }

        $conversation = new Conversation();
        $conversation->setType($type);
        $conversation->setName(null);
        $conversation->addParticipant($user);

        if (isset($data['participantIds'])) {
            if (!is_array($data['participantIds'])) {
                return $this->json(['error' => 'participantIds doit être un tableau'], 400);
            }
            if (count($data['participantIds']) !== 1) {
                return $this->json(['error' => 'Une conversation directe doit avoir exactement un autre participant'], 400);
            }
            foreach ($data['participantIds'] as $participantId) {
                if (!is_int($participantId) && !ctype_digit((string) $participantId)) {
                    return $this->json(['error' => 'participantIds contient une valeur invalide'], 400);
                }
                $participant = $this->userRepo->find((int) $participantId);
                if ($participant && !$conversation->getParticipants()->contains($participant)) {
                    $conversation->addParticipant($participant);
                }
            }
        }

        if ($type === 'direct' && $conversation->getParticipants()->count() !== 2) {
            return $this->json(['error' => 'Participant introuvable'], 400);
        }

        $otherParticipant = $conversation->getParticipants()->filter(
            fn(User $participant): bool => $participant->getId() !== $user->getId()
        )->first();
        if ($otherParticipant instanceof User) {
            $existing = $this->conversationRepo->findDirectConversation($user, $otherParticipant);
            if ($existing && $existing->getParticipants()->count() === 2) {
                return $this->json($this->serializeConversation($existing, $user));
            }
        }

        $this->em->persist($conversation);

        $this->em->flush();
        return $this->json($this->serializeConversation($conversation, $user), 201);
    }

    #[Route('/{id}/participants', methods: ['GET'], requirements: ['id' => '\d+'])]
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

    #[Route('/{id}/join', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function join(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }
        if ($conversation->getType() !== 'group') {
            return $this->json(['error' => 'Seulement pour les groupes'], 400);
        }
        if (!$conversation->getParticipants()->contains($user) && !$user->isAdmin()) {
            return $this->json(['error' => 'Invitation requise'], 403);
        }
        return $this->json($this->serializeConversation($conversation, $user));
    }

    #[Route('/{id}/leave', methods: ['POST'], requirements: ['id' => '\d+'])]
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
            $group = $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conversation]);
            if ($group?->getOwner()->getId() === $user->getId()) {
                return $this->json(['error' => 'Le propriétaire du groupe ne peut pas le quitter'], 409);
            }

            $conversation->removeParticipant($user);

            if ($group) {
                $member = $this->em->getRepository(GroupMember::class)->findOneBy(['group' => $group, 'user' => $user]);
                if ($member) {
                    $this->em->remove($member);
                }
            }

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

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Conversation $conversation, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $isParticipant = $conversation->getParticipants()->contains($user);
        if (!$user->isAdmin() && !$isParticipant) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        if (!$user->isAdmin() && $conversation->getType() === 'group') {
            $group = $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conversation]);
            if ($group && $group->getOwner()->getId() !== $user->getId()) {
                return $this->json(['error' => 'Seul le propriétaire du groupe peut le supprimer. Vous pouvez le quitter.'], 403);
            }
        }

        $this->em->remove($conversation);
        $this->em->flush();
        return $this->json(['success' => true]);
    }
}
