<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\User;
use App\Repository\MessageRepository;
use App\Repository\UserRepository;
use App\Service\OllamaService;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/conversations/{id}/messages')]
class MessageController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface $em,
        private MessageRepository $messageRepo,
        private UserRepository $userRepo,
        private OllamaService $ollama
    ) {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function getUserFromToken(Request $request): ?object
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);

        try {
            return JWT::decode($token, new Key($this->jwtKey, 'HS256'));
        } catch (\Exception $e) {
            error_log("[MessageController] JWT decode error: " . $e->getMessage());
            return null;
        }
    }

    #[Route('', methods: ['GET'])]
    public function index(
        Conversation $conversation,
        Request $request
    ): JsonResponse {
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }

        // Verify user is participant
        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $limit = $request->query->getInt('limit', 50);
        $offset = $request->query->getInt('offset', 0);

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
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }

        if (!$conversation->getParticipants()->contains($user)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $message = new Message();
        $message->setConversation($conversation);
        $message->setSender($user);
        $message->setContent($data['content']);
        $message->setType($data['type'] ?? 'text');

        $this->em->persist($message);
        $this->em->flush();

        // TODO: Broadcast via WebSocket

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
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }

        $this->messageRepo->markAsRead($conversation, $user->getId());
        return $this->json(['success' => true]);
    }

    #[Route('/{messageId}', methods: ['PATCH'])]
    public function update(
        Conversation $conversation,
        int $messageId,
        Request $request
    ): JsonResponse {
        $decoded = $this->getUserFromToken($request);

        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
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
        $newContent = trim((string)($data['content'] ?? ''));

        if ($newContent === '') {
            return $this->json(['error' => 'Le message ne peut pas être vide.'], 400);
        }

        $message->setContent($newContent);
        $this->em->persist($message);

        $botPayload = null;
        $regeneratedBotMessage = null;

        // Si conversation bot, on régénère la prochaine réponse IA
        if ($conversation->getType() === 'bot') {
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

            // Supprimer tous les messages après celui modifié (rebrancher la conversation)
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
            $newBotMessage->setSender($user); // TODO: utiliser un vrai sender bot dédié
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
