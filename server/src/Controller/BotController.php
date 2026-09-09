<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\MessageRepository;
use App\Service\JwtService;
use App\Service\OllamaService;
use App\Service\LoginRateLimiter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/bot')]
class BotController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private OllamaService $ollama,
        private ConversationRepository $conversationRepo,
        private MessageRepository $messageRepo,
        private JwtService $jwtService,
        private LoginRateLimiter $rateLimiter
    ) {
    }

    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    #[Route('/conversation', name: 'api_bot_get_conversation', methods: ['POST'])]
    public function getConversation(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $conversation = $this->conversationRepo->findBotConversationForUser($user);

        if (!$conversation) {
            $conversation = new Conversation();
            $conversation->setType('bot');
            $conversation->setName('WoofieBot 🐕');
            $conversation->addParticipant($user);
            $this->em->persist($conversation);
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
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        if ($retryAfter = $this->rateLimiter->assertBotAllowed((string) $user->getId())) {
            return $this->json(['error' => 'Trop de requêtes. Réessayez plus tard.'], 429, ['Retry-After' => (string) $retryAfter]);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid payload'], 400);
        }

        $userMessage = trim((string) ($data['message'] ?? ''));
        $conversationId = $data['conversationId'] ?? null;

        if ($userMessage === '' || mb_strlen($userMessage) > 5000) {
            return $this->json(['error' => 'Invalid message'], 400);
        }

        if ($conversationId) {
            $conversation = $this->conversationRepo->find($conversationId);
            if (!$conversation || $conversation->getType() !== 'bot' || !$conversation->getParticipants()->contains($user)) {
                return $this->json(['error' => 'Invalid bot conversation'], 404);
            }
        } else {
            $conversation = new Conversation();
            $conversation->setType('bot');
            $conversation->setName(mb_substr($userMessage, 0, 30) . '...');
            $conversation->addParticipant($user);
            $this->em->persist($conversation);
            $this->em->flush();
        }

        $history = $this->messageRepo->findRecentForConversation($conversation, 20);

        $historyArray = array_map(fn($msg) => [
            'role' => $msg->getType() === 'bot' ? 'assistant' : 'user',
            'content' => $msg->getContent()
        ], array_filter($history, fn($msg) => $msg->getType() !== 'system'));

        $userMessageEntity = new Message();
        $userMessageEntity->setConversation($conversation);
        $userMessageEntity->setSender($user);
        $userMessageEntity->setContent($userMessage);
        $userMessageEntity->setType('text');
        $this->em->persist($userMessageEntity);

        $botResponse = $this->ollama->chat($userMessage, $historyArray);

        $botMessage = new Message();
        $botMessage->setConversation($conversation);
        $botMessage->setSender(null);
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
