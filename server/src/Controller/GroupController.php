<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Group;
use App\Entity\GroupMember;
use App\Entity\User;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/groups')]
class GroupController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private JwtService $jwtService
    ) {
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid payload'], 400);
        }

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 120) {
            return $this->json(['error' => 'Invalid group name'], 400);
        }

        $settings = $data['settings'] ?? [];
        if (!is_array($settings)) {
            return $this->json(['error' => 'Invalid settings'], 400);
        }
        foreach (['allowMemberInvites', 'allowMemberMessages', 'isPrivate'] as $setting) {
            if (array_key_exists($setting, $settings) && !is_bool($settings[$setting])) {
                return $this->json(['error' => "Invalid {$setting} setting"], 400);
            }
        }

        $participantIds = $data['participantIds'] ?? [];
        if (!is_array($participantIds) || count($participantIds) > 100) {
            return $this->json(['error' => 'Invalid participant list'], 400);
        }

        foreach ($participantIds as $participantId) {
            if (!is_int($participantId) && !(is_string($participantId) && ctype_digit($participantId))) {
                return $this->json(['error' => 'Invalid participant identifier'], 400);
            }
        }
        $participantIds = array_unique(array_map('intval', $participantIds));

        $connection = $this->em->getConnection();
        $connection->beginTransaction();
        try {
            $conversation = new Conversation();
            $conversation->setType('group');
            $conversation->setName($name);
            $conversation->addParticipant($user);

            $this->em->persist($conversation);
            $this->em->flush();

            $group = new Group();
            $group->setConversation($conversation);
            $group->setOwner($user);
            $group->setAllowMemberInvites($settings['allowMemberInvites'] ?? false);
            $group->setAllowMemberMessages($settings['allowMemberMessages'] ?? true);
            $group->setIsPrivate($settings['isPrivate'] ?? false);

            $this->em->persist($group);

            $ownerMember = new GroupMember();
            $ownerMember->setGroup($group);
            $ownerMember->setUser($user);
            $ownerMember->setRole('owner');
            $ownerMember->setCanInvite(true);
            $this->em->persist($ownerMember);

            foreach ($participantIds as $participantId) {
                if ($participantId <= 0 || $participantId === $user->getId()) {
                    continue;
                }

                $participant = $this->em->getRepository(User::class)->find($participantId);
                if ($participant instanceof User && !$conversation->getParticipants()->contains($participant)) {
                    $conversation->addParticipant($participant);

                    $member = new GroupMember();
                    $member->setGroup($group);
                    $member->setUser($participant);
                    $member->setRole('member');
                    $this->em->persist($member);
                }
            }

            $this->em->flush();
            $connection->commit();
        } catch (\Throwable $exception) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }
            error_log('[GroupController::create] ' . $exception::class);
            return $this->json(['error' => 'Unable to create group'], 500);
        }

        return $this->json(['id' => $group->getId()], 201);
    }

    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(
        Group $group,
        Request $request
    ): JsonResponse {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $member = $this->em->getRepository(GroupMember::class)
            ->findOneBy(['group' => $group, 'user' => $user]);

        if (!$member || !in_array($member->getRole(), ['owner', 'admin'], true)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid payload'], 400);
        }

        if (isset($data['name'])) {
            $name = trim((string) $data['name']);
            if ($name === '' || mb_strlen($name) > 120) {
                return $this->json(['error' => 'Invalid group name'], 400);
            }
            $group->getConversation()->setName($name);
        }
        if (isset($data['settings'])) {
            if (!is_array($data['settings'])) {
                return $this->json(['error' => 'Invalid settings'], 400);
            }
            if (array_key_exists('allowMemberInvites', $data['settings'])) {
                if (!is_bool($data['settings']['allowMemberInvites'])) {
                    return $this->json(['error' => 'Invalid allowMemberInvites setting'], 400);
                }
                $group->setAllowMemberInvites($data['settings']['allowMemberInvites']);
            }
            if (array_key_exists('allowMemberMessages', $data['settings'])) {
                if (!is_bool($data['settings']['allowMemberMessages'])) {
                    return $this->json(['error' => 'Invalid allowMemberMessages setting'], 400);
                }
                $group->setAllowMemberMessages($data['settings']['allowMemberMessages']);
            }
            if (array_key_exists('isPrivate', $data['settings'])) {
                if (!is_bool($data['settings']['isPrivate'])) {
                    return $this->json(['error' => 'Invalid isPrivate setting'], 400);
                }
                $group->setIsPrivate($data['settings']['isPrivate']);
            }
        }

        $this->em->flush();

        return $this->json(['success' => true]);
    }
}
