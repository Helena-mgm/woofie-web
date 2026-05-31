<?php

namespace App\Repository;

use App\Entity\Message;
use App\Entity\Conversation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    public function findByConversation(
        Conversation $conversation,
        int $limit = 50,
        int $offset = 0
    ): array {
        return $this->createQueryBuilder('m')
            ->where('m.conversation = :conversation')
            ->setParameter('conversation', $conversation)
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function markAsRead(Conversation $conversation, int $userId): void
    {
        $this->createQueryBuilder('m')
            ->update()
            ->set('m.isRead', ':isRead')
            ->where('m.conversation = :conversation')
            ->andWhere('m.sender != :userId')
            ->setParameter('isRead', true)
            ->setParameter('conversation', $conversation)
            ->setParameter('userId', $userId)
            ->getQuery()
            ->execute();
    }
}
