<?php

namespace App\Controller;

use App\Entity\Conversation;
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
            error_log("[ConversationController] JWT decode error: " . $e->getMessage());
            return null;
        }
    }

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté pour accéder à cette page.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }

        $conversations = $this->conversationRepo->findByUser($user);
        
        $data = array_map(function($conv) use ($user) {
            return [
                'id' => $conv->getId(),
                'type' => $conv->getType(),
                'name' => $conv->getName(),
                'avatar' => $conv->getAvatar(),
                'participants' => array_map(
                    fn($p) => [
                        'id' => $p->getId(),
                        'name' => $p->getOwner() ? $p->getOwner()->getFullName() : $p->getEmail(),
                        'avatar' => $p->getOwner() ? $p->getOwner()->getPhotoPath() : null,
                        'isOnline' => false, // TODO: implement online status
                    ],
                    $conv->getParticipants()->toArray()
                ),
                'lastMessage' => null, // TODO: fix database schema for reply_to column
                'unreadCount' => 0, // TODO: implement unread count
                'createdAt' => $conv->getCreatedAt()->format('c'),
            ];
        }, $conversations);

        return $this->json($data);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $decoded = $this->getUserFromToken($request);
        
        if (!$decoded) {
            return $this->json(['error' => 'Vous devez être connecté.'], 401);
        }

        $user = $this->userRepo->find($decoded->sub);
        
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }

        $data = json_decode($request->getContent(), true);
        
        $conversation = new Conversation();
        $conversation->setType($data['type'] ?? 'direct');
        $conversation->setName($data['name'] ?? null);
        $conversation->addParticipant($user);

        if (isset($data['participantIds'])) {
            foreach ($data['participantIds'] as $participantId) {
                $participant = $this->em->getRepository(User::class)->find($participantId);
                if ($participant) {
                    $conversation->addParticipant($participant);
                }
            }
        }

        $this->em->persist($conversation);
        $this->em->flush();

        return $this->json(['id' => $conversation->getId()], 201);
    }
}
