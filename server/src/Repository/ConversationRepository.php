<?php

namespace App\Repository;

use App\Entity\Conversation;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->innerJoin('c.participants', 'p')
            ->where('p = :user')
            ->setParameter('user', $user)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findDirectConversation(User $user1, User $user2): ?Conversation
    {
        return $this->createQueryBuilder('c')
            ->innerJoin('c.participants', 'p1')
            ->innerJoin('c.participants', 'p2')
            ->where('c.type = :type')
            ->andWhere('p1 = :user1')
            ->andWhere('p2 = :user2')
            ->setParameter('type', 'direct')
            ->setParameter('user1', $user1)
            ->setParameter('user2', $user2)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function getUnreadCount(Conversation $conversation, User $user): int
    {
        return $this->getEntityManager()
            ->createQuery('
                SELECT COUNT(m)
                FROM App\Entity\Message m
                WHERE m.conversation = :conversation
                AND m.sender != :user
                AND m.isRead = false
            ')
            ->setParameter('conversation', $conversation)
            ->setParameter('user', $user)
            ->getSingleScalarResult();
    }
}
