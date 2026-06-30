<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Repository\ConversationRepository;
use App\Repository\MessageRepository;
use App\Repository\UserRepository;
use App\Service\OllamaService;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/bot')]
class BotController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface $em,
        private OllamaService $ollama,
        private ConversationRepository $conversationRepo,
        private MessageRepository $messageRepo,
        private UserRepository $userRepo
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
            error_log("[BotController] JWT decode error: " . $e->getMessage());
            return null;
        }
    }

    #[Route('/conversation', name: 'api_bot_get_conversation', methods: ['GET'])]
    public function getConversation(Request $request): JsonResponse
    {
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        $conversation = $this->conversationRepo->findOneBy(['type' => 'bot']);

        if (!$conversation) {
            $conversation = new Conversation();
            $conversation->setType('bot');
            $conversation->setName('WoofieBot 🐕');
            $conversation->addParticipant($user);
            $this->em->persist($conversation);
            $this->em->flush();
        } elseif (!$conversation->getParticipants()->contains($user)) {
            $conversation->addParticipant($user);
            $this->em->flush();
        }

        return $this->json([
            'id' => $conversation->getId(),
            'name' => $conversation->getName(),
            'type' => $conversation->getType(),
        ]);
    }

    #[Route('/chat', name: 'api_bot_chat', methods: ['POST'])]
    public function chat(Request $request): JsonResponse
    {
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $userMessage = $data['message'] ?? '';
        $conversationId = $data['conversationId'] ?? null;

        if (empty($userMessage)) {
            return $this->json(['error' => 'Message required'], 400);
        }

        // Récupérer ou créer la conversation bot
        if ($conversationId) {
            $conversation = $this->conversationRepo->find($conversationId);
            if (!$conversation || $conversation->getType() !== 'bot' || !$conversation->getParticipants()->contains($user)) {
                return $this->json(['error' => 'Invalid bot conversation'], 404);
            }
        } else {
            // Pas de conversationId fourni, on crée une nouvelle conversation bot
            $conversation = new Conversation();
            $conversation->setType('bot');
            $conversation->setName(mb_substr($userMessage, 0, 30) . '...');
            $conversation->addParticipant($user);
            $this->em->persist($conversation);
            $this->em->flush();
        }

        $history = $this->messageRepo->findBy(
            ['conversation' => $conversation],
            ['createdAt' => 'ASC'],
            20
        );

        $historyArray = array_map(fn($msg) => [
            'role' => $msg->getSender()?->getId() === $user->getId() ? 'user' : 'assistant',
            'content' => $msg->getContent()
        ], array_filter($history, fn($msg) => $msg->getType() !== 'system'));

        // Sauvegarder le message de l'utilisateur
        $userMessageEntity = new Message();
        $userMessageEntity->setConversation($conversation);
        $userMessageEntity->setSender($user);
        $userMessageEntity->setContent($userMessage);
        $userMessageEntity->setType('text');
        $this->em->persist($userMessageEntity);

        // Générer et sauvegarder la réponse du bot
        $botResponse = $this->ollama->chat($userMessage, $historyArray);

        $botMessage = new Message();
        $botMessage->setConversation($conversation);
        $botMessage->setSender($user); // Le bot utilise le même sender pour l'instant
        $botMessage->setContent($botResponse);
        $botMessage->setType('bot');
        $this->em->persist($botMessage);
        
        $this->em->flush();

        return $this->json([
            'id' => $botMessage->getId(),
            'conversationId' => $conversation->getId(),
            'content' => $botMessage->getContent(),
            'createdAt' => $botMessage->getCreatedAt()->format('c'),
            'sender' => 'bot',
        ]);
    }
}
