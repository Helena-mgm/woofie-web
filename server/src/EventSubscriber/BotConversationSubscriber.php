<?php

namespace App\EventSubscriber;

use App\Entity\Conversation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

class BotConversationSubscriber implements EventSubscriberInterface
{
    public function __construct(private EntityManagerInterface $em) {}

    public static function getSubscribedEvents(): array
    {
        return [LoginSuccessEvent::class => 'onLoginSuccess'];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) return;

        $repo = $this->em->getRepository(Conversation::class);
        $botConversation = $repo->findOneBy(['type' => 'bot']);

        if (!$botConversation) {
            $botConversation = new Conversation();
            $botConversation->setType('bot');
            $botConversation->setName('WoofieBot 🐕');
            $botConversation->setAvatar('/woofiebot-avatar.png');
            $this->em->persist($botConversation);
        }

        if (!$botConversation->getParticipants()->contains($user)) {
            $botConversation->addParticipant($user);
            $this->em->flush();
        }
    }
}
