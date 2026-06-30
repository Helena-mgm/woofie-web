<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Event;
use App\Entity\EventAttendee;
use App\Entity\Group;
use App\Entity\GroupMember;
use App\Entity\Notification;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\NotificationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/events')]
class EventController extends AbstractController
{
    private string $jwtKey;

    public function __construct(
        private EntityManagerInterface $em,
        private EventRepository        $eventRepo,
        private UserRepository         $userRepo,
        private NotificationRepository $notifRepo,
    ) {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    // ── Auth helper ──────────────────────────────────────────────────────────

    private function getUserFromToken(Request $request): ?User
    {
        $header = $request->headers->get('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) return null;

        try {
            $decoded = JWT::decode(substr($header, 7), new Key($this->jwtKey, 'HS256'));
            return isset($decoded->sub) ? $this->userRepo->find((int) $decoded->sub) : null;
        } catch (\Exception) {
            return null;
        }
    }

    /** Résout le nom affiché d'un utilisateur (Owner/Sitter ou email). */
    private function resolveDisplayName(User $user): string
    {
        if (method_exists($user, 'getOwner') && $user->getOwner()) {
            return $user->getOwner()->getFullName();
        }
        return explode('@', $user->getEmail())[0];
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    /** GET /api/events — liste des événements accessibles (auth optionnelle) */
    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user  = $this->getUserFromToken($request);
        $today = new \DateTime('today');

        return $this->json([
            'upcoming' => array_map(
                fn(Event $e) => $e->toArray($user),
                $this->eventRepo->findUpcoming($today, $user)
            ),
            'past' => array_map(
                fn(Event $e) => $e->toArray($user),
                $this->eventRepo->findPast($today, $user)
            ),
        ]);
    }

    /** POST /api/events — créer un événement + groupe de discussion */
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $data = json_decode($request->getContent(), true) ?? [];

        foreach (['title', 'description', 'date', 'time', 'location', 'category'] as $field) {
            if (empty($data[$field])) {
                return $this->json(['error' => "Le champ '{$field}' est obligatoire"], 400);
            }
        }

        $event = (new Event())
            ->setTitle(trim($data['title']))
            ->setDescription(trim($data['description']))
            ->setDate(new \DateTime($data['date']))
            ->setTime($data['time'])
            ->setLocation(trim($data['location']))
            ->setCategory($data['category'])
            ->setImage($data['image'] ?? '🐾')
            ->setOrganizer($user)
            ->setIsPrivate((bool) ($data['isPrivate'] ?? false))
            ->setRequiresApproval((bool) ($data['requiresApproval'] ?? false));

        if (!empty($data['lat'])) $event->setLat((float) $data['lat']);
        if (!empty($data['lng'])) $event->setLng((float) $data['lng']);
        if (array_key_exists('maxAttendees', $data)) {
            $event->setMaxAttendees($data['maxAttendees'] ? (int) $data['maxAttendees'] : null);
        }

        // ── Créer le groupe de discussion associé ─────────────────────────
        $conversation = (new Conversation())
            ->setType('group')
            ->setName('🎉 ' . trim($data['title']));
        $conversation->addParticipant($user);

        $this->em->persist($conversation);
        $this->em->flush(); // flush pour obtenir l'id de la conversation

        $group = (new Group())
            ->setConversation($conversation)
            ->setOwner($user)
            ->setIsPrivate(false)
            ->setAllowMemberInvites(false)
            ->setAllowMemberMessages(true);

        $member = (new GroupMember())
            ->setGroup($group)
            ->setUser($user)
            ->setRole('owner');

        $event->setConversationId($conversation->getId());

        $this->em->persist($group);
        $this->em->persist($member);
        $this->em->persist($event);
        $this->em->flush();

        return $this->json($event->toArray($user), 201);
    }

    /** GET /api/events/{id} — détail d'un événement (auth optionnelle) */
    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        $user = $this->getUserFromToken($request);

        if ($event->isPrivate() && !$this->canAccessPrivate($event, $user)) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        return $this->json($event->toArray($user));
    }

    /** PUT /api/events/{id} — modifier un événement (organisateur seulement) */
    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['title']))       $event->setTitle($data['title']);
        if (isset($data['description'])) $event->setDescription($data['description']);
        if (isset($data['date']))        $event->setDate(new \DateTime($data['date']));
        if (isset($data['time']))        $event->setTime($data['time']);
        if (isset($data['location']))    $event->setLocation($data['location']);
        if (isset($data['category']))    $event->setCategory($data['category']);
        if (isset($data['image']))       $event->setImage($data['image']);
        if (isset($data['isPrivate']))   $event->setIsPrivate((bool) $data['isPrivate']);
        if (isset($data['requiresApproval'])) $event->setRequiresApproval((bool) $data['requiresApproval']);
        if (array_key_exists('lat', $data)) $event->setLat($data['lat'] !== null ? (float) $data['lat'] : null);
        if (array_key_exists('lng', $data)) $event->setLng($data['lng'] !== null ? (float) $data['lng'] : null);
        if (array_key_exists('maxAttendees', $data)) {
            $event->setMaxAttendees($data['maxAttendees'] ? (int) $data['maxAttendees'] : null);
        }

        // Renommer le groupe si le titre a changé
        if (isset($data['title']) && $event->getConversationId()) {
            $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
            if ($conv) $conv->setName('🎉 ' . trim($data['title']));
        }

        $this->em->flush();

        return $this->json($event->toArray($user));
    }

    /** DELETE /api/events/{id} — supprimer l'événement + son groupe */
    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        // Supprimer la conversation associée (cascade sur Group, GroupMember, Messages)
        if ($event->getConversationId()) {
            $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
            if ($conv) $this->em->remove($conv);
        }

        $this->em->remove($event);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    /** POST /api/events/{id}/join — rejoindre / demander à rejoindre un événement */
    #[Route('/{id}/join', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function join(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() === $user->getId()) {
            return $this->json($event->toArray($user));
        }

        $existing = $this->em->getRepository(EventAttendee::class)
            ->findOneBy(['event' => $event, 'user' => $user]);

        if (!$existing) {
            if ($event->getMaxAttendees() !== null) {
                $accepted = $event->getAttendees()->filter(
                    fn(EventAttendee $a) => $a->getStatus() === 'accepted'
                )->count();
                if ($accepted >= $event->getMaxAttendees()) {
                    return $this->json(['error' => 'Cet événement est complet.'], 409);
                }
            }

            $status = $event->requiresApproval() ? 'pending' : 'accepted';

            $att = (new EventAttendee())
                ->setEvent($event)
                ->setUser($user)
                ->setStatus($status);

            $this->em->persist($att);

            // Ajouter au groupe si accepté directement
            if ($status === 'accepted') {
                $this->addUserToEventGroup($event, $user);
            }

            // Notifier l'organisateur
            $joinerName = $this->resolveDisplayName($user);
            $this->sendNotification(
                $event->getOrganizer(),
                $status === 'accepted' ? 'event_join' : 'event_pending',
                $status === 'accepted' ? 'Nouveau participant 🎉' : 'Nouvelle demande ⏳',
                $status === 'accepted'
                    ? "{$joinerName} a rejoint « {$event->getTitle()} »"
                    : "{$joinerName} demande à rejoindre « {$event->getTitle()} »",
                ['eventId' => $event->getId(), 'userId' => $user->getId(), 'conversationId' => $event->getConversationId()]
            );

            $this->em->flush();
        }

        $this->em->refresh($event);

        return $this->json($event->toArray($user));
    }

    /** POST /api/events/{id}/leave — quitter un événement */
    #[Route('/{id}/leave', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function leave(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() === $user->getId()) {
            return $this->json(['error' => "L'organisateur ne peut pas quitter son propre événement"], 400);
        }

        $att = $this->em->getRepository(EventAttendee::class)
            ->findOneBy(['event' => $event, 'user' => $user]);

        if ($att) {
            $this->removeUserFromEventGroup($event, $user);
            $this->em->remove($att);

            // Notifier l'organisateur
            $leaverName = $this->resolveDisplayName($user);
            $this->sendNotification(
                $event->getOrganizer(),
                'event_leave',
                'Participant parti 👋',
                "{$leaverName} a quitté « {$event->getTitle()} »",
                ['eventId' => $event->getId(), 'userId' => $user->getId()]
            );

            $this->em->flush();
            $this->em->refresh($event);
        }

        return $this->json($event->toArray($user));
    }

    /** GET /api/events/{id}/attendees — liste des participants */
    #[Route('/{id}/attendees', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function attendees(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        $user        = $this->getUserFromToken($request);
        $isOrganizer = $user && $event->getOrganizer()->getId() === $user->getId();

        $result = [];
        foreach ($event->getAttendees() as $att) {
            if (!$isOrganizer && $att->getStatus() !== 'accepted') continue;
            $attUser = $att->getUser();
            $photo   = null;
            if (method_exists($attUser, 'getOwner') && $attUser->getOwner()) {
                $photo = $attUser->getOwner()->getPhotoPath();
            }
            $result[] = [
                'userId'   => $attUser->getId(),
                'name'     => $this->resolveDisplayName($attUser),
                'photo'    => $photo,
                'status'   => $att->getStatus(),
                'joinedAt' => $att->getJoinedAt()->format('c'),
            ];
        }

        return $this->json($result);
    }

    /** POST /api/events/{id}/attendees/{userId}/approve */
    #[Route('/{id}/attendees/{userId}/approve', methods: ['POST'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    public function approveAttendee(int $id, int $userId, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() !== $user->getId()) {
            return $this->json(['error' => "Seul l'organisateur peut gérer les participants"], 403);
        }

        $targetUser = $this->userRepo->find($userId);
        if (!$targetUser) return $this->json(['error' => 'Utilisateur introuvable'], 404);

        $att = $this->em->getRepository(EventAttendee::class)
            ->findOneBy(['event' => $event, 'user' => $targetUser]);
        if (!$att) return $this->json(['error' => 'Participant introuvable'], 404);

        $att->setStatus('accepted');
        $this->addUserToEventGroup($event, $targetUser);

        $this->sendNotification(
            $targetUser,
            'event_approved',
            'Participation confirmée ✅',
            "Votre demande pour « {$event->getTitle()} » a été acceptée !",
            ['eventId' => $event->getId(), 'conversationId' => $event->getConversationId()]
        );

        $this->em->flush();

        return $this->json(['success' => true, 'status' => 'accepted']);
    }

    /** POST /api/events/{id}/attendees/{userId}/reject */
    #[Route('/{id}/attendees/{userId}/reject', methods: ['POST'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    public function rejectAttendee(int $id, int $userId, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() !== $user->getId()) {
            return $this->json(['error' => "Seul l'organisateur peut gérer les participants"], 403);
        }

        $targetUser = $this->userRepo->find($userId);
        if (!$targetUser) return $this->json(['error' => 'Utilisateur introuvable'], 404);

        $att = $this->em->getRepository(EventAttendee::class)
            ->findOneBy(['event' => $event, 'user' => $targetUser]);
        if (!$att) return $this->json(['error' => 'Participant introuvable'], 404);

        $att->setStatus('rejected');

        $this->sendNotification(
            $targetUser,
            'event_rejected',
            'Participation refusée ❌',
            "Votre demande pour « {$event->getTitle()} » n'a pas été acceptée.",
            ['eventId' => $event->getId()]
        );

        $this->em->flush();

        return $this->json(['success' => true, 'status' => 'rejected']);
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private function sendNotification(User $recipient, string $type, string $title, string $body, ?array $data = null): void
    {
        $notif = (new Notification())
            ->setUser($recipient)
            ->setType($type)
            ->setTitle($title)
            ->setBody($body)
            ->setData($data);

        $this->em->persist($notif);
    }

    private function addUserToEventGroup(Event $event, User $user): void
    {
        if (!$event->getConversationId()) return;

        $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
        if (!$conv) return;

        $conv->addParticipant($user);

        $group = $this->em->getRepository(Group::class)->find($event->getConversationId());
        if ($group) {
            $alreadyMember = $this->em->getRepository(GroupMember::class)
                ->findOneBy(['group' => $group, 'user' => $user]);
            if (!$alreadyMember) {
                $member = (new GroupMember())
                    ->setGroup($group)
                    ->setUser($user)
                    ->setRole('member');
                $this->em->persist($member);
            }
        }
    }

    private function removeUserFromEventGroup(Event $event, User $user): void
    {
        if (!$event->getConversationId()) return;

        $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
        if ($conv) $conv->removeParticipant($user);

        $group = $this->em->getRepository(Group::class)->find($event->getConversationId());
        if ($group) {
            $member = $this->em->getRepository(GroupMember::class)
                ->findOneBy(['group' => $group, 'user' => $user]);
            if ($member) $this->em->remove($member);
        }
    }

    private function canAccessPrivate(Event $event, ?User $user): bool
    {
        if (!$user) return false;
        if ($event->getOrganizer()->getId() === $user->getId()) return true;
        foreach ($event->getAttendees() as $att) {
            if ($att->getUser()->getId() === $user->getId()) return true;
        }
        return false;
    }
}

