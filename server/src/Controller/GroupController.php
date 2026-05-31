<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Group;
use App\Entity\GroupMember;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/groups')]
class GroupController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $conversation = new Conversation();
        $conversation->setType('group');
        $conversation->setName($data['name']);
        $conversation->addParticipant($user);

        $this->em->persist($conversation);
        $this->em->flush();

        $group = new Group();
        $group->setConversation($conversation);
        $group->setOwner($user);
        $group->setAllowMemberInvites($data['settings']['allowMemberInvites'] ?? false);
        $group->setIsPrivate($data['settings']['isPrivate'] ?? false);

        $this->em->persist($group);

        // Owner as member
        $ownerMember = new GroupMember();
        $ownerMember->setGroup($group);
        $ownerMember->setUser($user);
        $ownerMember->setRole('owner');
        $ownerMember->setCanInvite(true);
        $this->em->persist($ownerMember);

        // Add participants
        if (isset($data['participantIds'])) {
            foreach ($data['participantIds'] as $participantId) {
                $participant = $this->em->getRepository(User::class)->find($participantId);
                if ($participant) {
                    $conversation->addParticipant($participant);
                    
                    $member = new GroupMember();
                    $member->setGroup($group);
                    $member->setUser($participant);
                    $member->setRole('member');
                    $this->em->persist($member);
                }
            }
        }

        $this->em->flush();

        return $this->json(['id' => $group->getId()], 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(
        Group $group,
        Request $request,
        #[CurrentUser] User $user
    ): JsonResponse {
        $member = $this->em->getRepository(GroupMember::class)
            ->findOneBy(['group' => $group, 'user' => $user]);

        if (!$member || !in_array($member->getRole(), ['owner', 'admin'])) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $group->getConversation()->setName($data['name']);
        }
        if (isset($data['settings'])) {
            if (isset($data['settings']['allowMemberInvites'])) {
                $group->setAllowMemberInvites($data['settings']['allowMemberInvites']);
            }
            if (isset($data['settings']['isPrivate'])) {
                $group->setIsPrivate($data['settings']['isPrivate']);
            }
        }

        $this->em->flush();

        return $this->json(['success' => true]);
    }
}
