<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\User;
use App\Entity\Group;
use App\Entity\GroupMember;
use App\Repository\MessageRepository;
use App\Service\JwtService;
use App\Service\LoginRateLimiter;
use App\Service\OllamaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/conversations/{id}/messages', requirements: ['id' => '\d+'])]
class MessageController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MessageRepository $messageRepo,
        private JwtService $jwtService,
        private OllamaService $ollama,
        private LoginRateLimiter $rateLimiter
    ) {
    }

    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    #[Route('', methods: ['GET'])]
    public function index(
        Conversation $conversation,
        Request $request
    ): JsonResponse {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $limit = min(100, max(1, $request->query->getInt('limit', 50)));
        $offset = max(0, $request->query->getInt('offset', 0));

        $messages = $this->messageRepo->findByConversation(
            $conversation,
            $limit,
            $offset
        );

        $data = array_map(fn($msg) => [
            'id' => $msg->getId(),
            'conversationId' => $msg->getConversation()->getId(),
            'senderId' => $msg->getSender()?->getId(),
            'content' => $msg->getContent(),
            'type' => $msg->getType(),
            'createdAt' => $msg->getCreatedAt()->format('c'),
            'isRead' => $msg->isRead(),
        ], $messages);

        return $this->json(array_reverse($data));
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Conversation $conversation,
        Request $request
    ): JsonResponse {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $group = $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conversation]);
        if ($group && !$group->isAllowMemberMessages()) {
            $member = $this->em->getRepository(GroupMember::class)->findOneBy(['group' => $group, 'user' => $user]);
            if (!$member || !in_array($member->getRole(), ['owner', 'admin'], true)) {
                return $this->json(['error' => 'Les messages sont désactivés pour les membres'], 403);
            }
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }

        $content = trim((string) ($data['content'] ?? ''));
        if ($content === '' || mb_strlen($content) > 5000) {
            return $this->json(['error' => 'Message invalide'], 400);
        }

        $type = $data['type'] ?? 'text';
        if ($type !== 'text') {
            return $this->json(['error' => 'Type de message invalide'], 400);
        }

        $message = new Message();
        $message->setConversation($conversation);
        $message->setSender($user);
        $message->setContent($content);
        $message->setType($type);

        $this->em->persist($message);
        $this->em->flush();

        return $this->json([
            'id' => $message->getId(),
            'createdAt' => $message->getCreatedAt()->format('c'),
        ], 201);
    }

    #[Route('/read', methods: ['POST'])]
    public function markAsRead(
        Conversation $conversation,
        Request $request
    ): JsonResponse {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $this->messageRepo->markAsRead($conversation, $user->getId());
        return $this->json(['success' => true]);
    }

    #[Route('/{messageId}', methods: ['PATCH'], requirements: ['messageId' => '\d+'])]
    public function update(
        Conversation $conversation,
        int $messageId,
        Request $request
    ): JsonResponse {
        $user = $this->getUserFromToken($request);

        if (!$user) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $message = $this->messageRepo->findOneBy([
            'id' => $messageId,
            'conversation' => $conversation,
        ]);

        if (!$message) {
            return $this->json(['error' => 'Message introuvable.'], 404);
        }

        if ($message->getSender()?->getId() !== $user->getId() || $message->getType() === 'bot') {
            return $this->json(['error' => 'Modification non autorisée.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide.'], 400);
        }

        $newContent = trim((string) ($data['content'] ?? ''));

        if ($newContent === '' || mb_strlen($newContent) > 5000) {
            return $this->json(['error' => 'Message invalide.'], 400);
        }

        $message->setContent($newContent);
        $this->em->persist($message);

        $botPayload = null;
        $regeneratedBotMessage = null;

        if ($conversation->getType() === 'bot') {
            if ($retryAfter = $this->rateLimiter->assertBotAllowed((string) $user->getId())) {
                return $this->json(['error' => 'Trop de requêtes. Réessayez plus tard.'], 429, ['Retry-After' => (string) $retryAfter]);
            }

            $history = $this->messageRepo->createQueryBuilder('m')
                ->where('m.conversation = :conversation')
                ->andWhere('m.id < :messageId')
                ->setParameter('conversation', $conversation)
                ->setParameter('messageId', $message->getId())
                ->orderBy('m.id', 'DESC')
                ->setMaxResults(20)
                ->getQuery()
                ->getResult();

            $history = array_reverse($history);
            $historyArray = array_map(
                fn(Message $msg) => [
                    'role' => $msg->getType() === 'bot' ? 'assistant' : 'user',
                    'content' => $msg->getContent(),
                ],
                $history
            );

            $this->messageRepo->createQueryBuilder('m')
                ->delete()
                ->where('m.conversation = :conversation')
                ->andWhere('m.id > :messageId')
                ->setParameter('conversation', $conversation)
                ->setParameter('messageId', $message->getId())
                ->getQuery()
                ->execute();

            $newBotResponse = $this->ollama->chat($newContent, $historyArray);

            $newBotMessage = new Message();
            $newBotMessage->setConversation($conversation);
            $newBotMessage->setSender(null);
            $newBotMessage->setType('bot');
            $newBotMessage->setContent($newBotResponse);
            $this->em->persist($newBotMessage);
            $regeneratedBotMessage = $newBotMessage;
        }

        $this->em->flush();

        if ($regeneratedBotMessage) {
            $botPayload = [
                'id' => $regeneratedBotMessage->getId(),
                'conversationId' => $conversation->getId(),
                'senderId' => $regeneratedBotMessage->getSender()?->getId(),
                'content' => $regeneratedBotMessage->getContent(),
                'type' => $regeneratedBotMessage->getType(),
                'createdAt' => $regeneratedBotMessage->getCreatedAt()->format('c'),
                'isRead' => $regeneratedBotMessage->isRead(),
            ];
        }

        return $this->json([
            'message' => [
                'id' => $message->getId(),
                'conversationId' => $conversation->getId(),
                'senderId' => $message->getSender()?->getId(),
                'content' => $message->getContent(),
                'type' => $message->getType(),
                'createdAt' => $message->getCreatedAt()->format('c'),
                'isRead' => $message->isRead(),
            ],
            'botMessage' => $botPayload,
        ]);
    }
}
