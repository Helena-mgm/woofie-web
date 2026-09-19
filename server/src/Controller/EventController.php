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
use App\Repository\UserRepository;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/events')]
class EventController extends AbstractController
{
    private const CATEGORIES = ['Rencontre', 'Formation', 'Compétition', 'Charity'];

    public function __construct(
        private EntityManagerInterface $em,
        private EventRepository        $eventRepo,
        private UserRepository         $userRepo,
        private JwtService             $jwtService,
    ) {
    }


    private function getUserFromToken(Request $request): ?User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    private function resolveDisplayName(User $user): string
    {
        if (method_exists($user, 'getOwner') && $user->getOwner()) {
            return $user->getOwner()->getFullName();
        }
        return explode('@', $user->getEmail())[0];
    }


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

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }
        $normalized = $this->normalizeEventPayload($data, false);
        if (is_string($normalized)) {
            return $this->json(['error' => $normalized], 400);
        }

        $event = (new Event())
            ->setTitle($normalized['title'])
            ->setDescription($normalized['description'])
            ->setDate($normalized['date'])
            ->setTime($normalized['time'])
            ->setLocation($normalized['location'])
            ->setCategory($normalized['category'])
            ->setImage($normalized['image'] ?? '🐾')
            ->setOrganizer($user)
            ->setIsPrivate($normalized['isPrivate'] ?? false)
            ->setRequiresApproval($normalized['requiresApproval'] ?? false);

        $event->setLat($normalized['lat'] ?? null);
        $event->setLng($normalized['lng'] ?? null);
        $event->setMaxAttendees($normalized['maxAttendees'] ?? null);

        $connection = $this->em->getConnection();
        $connection->beginTransaction();
        try {
            $conversation = (new Conversation())
                ->setType('group')
                ->setName('🎉 ' . $normalized['title']);
            $conversation->addParticipant($user);

            $this->em->persist($conversation);
            $this->em->flush();

            $group = (new Group())
                ->setConversation($conversation)
                ->setOwner($user)
                ->setIsPrivate($event->isPrivate())
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
            $connection->commit();
        } catch (\Throwable $exception) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }
            error_log('[EventController::create] ' . $exception::class);
            return $this->json(['error' => "Impossible de créer l'événement"], 500);
        }

        return $this->json($event->toArray($user), 201);
    }

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

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Payload invalide'], 400);
        }
        $normalized = $this->normalizeEventPayload($data, true);
        if (is_string($normalized)) {
            return $this->json(['error' => $normalized], 400);
        }

        if (array_key_exists('title', $normalized)) $event->setTitle($normalized['title']);
        if (array_key_exists('description', $normalized)) $event->setDescription($normalized['description']);
        if (array_key_exists('date', $normalized)) $event->setDate($normalized['date']);
        if (array_key_exists('time', $normalized)) $event->setTime($normalized['time']);
        if (array_key_exists('location', $normalized)) $event->setLocation($normalized['location']);
        if (array_key_exists('category', $normalized)) $event->setCategory($normalized['category']);
        if (array_key_exists('image', $normalized)) $event->setImage($normalized['image']);
        if (array_key_exists('isPrivate', $normalized)) $event->setIsPrivate($normalized['isPrivate']);
        if (array_key_exists('requiresApproval', $normalized)) $event->setRequiresApproval($normalized['requiresApproval']);
        if (array_key_exists('lat', $normalized)) $event->setLat($normalized['lat']);
        if (array_key_exists('lng', $normalized)) $event->setLng($normalized['lng']);
        if (array_key_exists('maxAttendees', $normalized)) $event->setMaxAttendees($normalized['maxAttendees']);

        if ($event->getConversationId()) {
            $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
            if ($conv && isset($normalized['title'])) $conv->setName('🎉 ' . $normalized['title']);
            $group = $conv
                ? $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conv])
                : null;
            if ($group) $group->setIsPrivate($event->isPrivate());
        }

        $this->em->flush();

        return $this->json($event->toArray($user));
    }

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) return $this->json(['error' => 'Authentification requise'], 401);

        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        if ($event->getOrganizer()->getId() !== $user->getId() && !$user->isAdmin()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        if ($event->getConversationId()) {
            $conv = $this->em->getRepository(Conversation::class)->find($event->getConversationId());
            if ($conv) $this->em->remove($conv);
        }

        $this->em->remove($event);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

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

        if (!$existing && $event->isPrivate()) {
            return $this->json(['error' => 'Cet événement est privé, seul l\'organisateur peut y ajouter des participants'], 403);
        }

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

            if ($status === 'accepted') {
                $this->addUserToEventGroup($event, $user);
            }

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

    #[Route('/{id}/attendees', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function attendees(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        $user = $this->getUserFromToken($request);
        if ($event->isPrivate() && !$this->canAccessPrivate($event, $user)) {
            return $this->json(['error' => 'Événement introuvable'], 404);
        }
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

        if ($att->getStatus() === 'accepted') {
            return $this->json(['success' => true, 'status' => 'accepted']);
        }
        if ($event->getMaxAttendees() !== null) {
            $accepted = $event->getAttendees()->filter(
                fn(EventAttendee $attendee) => $attendee->getStatus() === 'accepted'
            )->count();
            if ($accepted >= $event->getMaxAttendees()) {
                return $this->json(['error' => 'Cet événement est complet.'], 409);
            }
        }

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

        $this->removeUserFromEventGroup($event, $targetUser);
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

        $group = $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conv]);
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

        $group = $conv
            ? $this->em->getRepository(Group::class)->findOneBy(['conversation' => $conv])
            : null;
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
            if ($att->getUser()->getId() === $user->getId() && in_array($att->getStatus(), ['pending', 'accepted'], true)) return true;
        }
        return false;
    }

    private function normalizeEventPayload(array $data, bool $partial): array|string
    {
        $required = ['title', 'description', 'date', 'time', 'location', 'category'];
        if (!$partial) {
            foreach ($required as $field) {
                if (!array_key_exists($field, $data)) {
                    return "Le champ '{$field}' est obligatoire";
                }
            }
        }

        $normalized = [];
        foreach (['title' => 255, 'description' => 5000, 'location' => 255] as $field => $maxLength) {
            if (!array_key_exists($field, $data)) continue;
            if (!is_string($data[$field])) return "Le champ '{$field}' est invalide";
            $value = trim($data[$field]);
            if ($value === '' || mb_strlen($value) > $maxLength) return "Le champ '{$field}' est invalide";
            $normalized[$field] = $value;
        }

        if (array_key_exists('date', $data)) {
            if (!is_string($data['date'])) return 'Date invalide';
            $date = \DateTime::createFromFormat('!Y-m-d', $data['date']);
            $errors = \DateTime::getLastErrors();
            if (!$date || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0)) || $date->format('Y-m-d') !== $data['date']) {
                return 'Date invalide';
            }
            $normalized['date'] = $date;
        }

        if (array_key_exists('time', $data)) {
            if (!is_string($data['time']) || preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $data['time']) !== 1) return 'Heure invalide';
            $normalized['time'] = $data['time'];
        }

        if (array_key_exists('category', $data)) {
            if (!is_string($data['category']) || !in_array($data['category'], self::CATEGORIES, true)) return 'Catégorie invalide';
            $normalized['category'] = $data['category'];
        }

        if (array_key_exists('image', $data)) {
            if (!is_string($data['image']) || mb_strlen($data['image']) > 20) return 'Image invalide';
            $normalized['image'] = $data['image'];
        }

        foreach (['isPrivate', 'requiresApproval'] as $field) {
            if (!array_key_exists($field, $data)) continue;
            if (!is_bool($data[$field])) return "Le champ '{$field}' doit être booléen";
            $normalized[$field] = $data[$field];
        }

        foreach (['lat' => [-90.0, 90.0], 'lng' => [-180.0, 180.0]] as $field => [$min, $max]) {
            if (!array_key_exists($field, $data)) continue;
            if ($data[$field] === null || $data[$field] === '') {
                $normalized[$field] = null;
                continue;
            }
            if (!is_numeric($data[$field])) return "Le champ '{$field}' est invalide";
            $value = (float) $data[$field];
            if (!is_finite($value) || $value < $min || $value > $max) return "Le champ '{$field}' est invalide";
            $normalized[$field] = $value;
        }

        if (array_key_exists('maxAttendees', $data)) {
            if ($data['maxAttendees'] === null || $data['maxAttendees'] === '') {
                $normalized['maxAttendees'] = null;
            } else {
                $maxAttendees = filter_var($data['maxAttendees'], FILTER_VALIDATE_INT);
                if ($maxAttendees === false || $maxAttendees < 1 || $maxAttendees > 10000) return 'Nombre maximal de participants invalide';
                $normalized['maxAttendees'] = $maxAttendees;
            }
        }

        return $normalized;
    }
}
