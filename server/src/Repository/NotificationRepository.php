<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /** @return Notification[] */
    public function findForUser(User $user, int $limit = 50): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.isRead', 'ASC')    // non lues d'abord
            ->addOrderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countUnread(User $user): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.user = :user AND n.isRead = FALSE')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function markAllReadForUser(User $user): void
    {
        $this->createQueryBuilder('n')
            ->update()
            ->set('n.isRead', 'TRUE')
            ->where('n.user = :user AND n.isRead = FALSE')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();
    }

    public function deleteAllForUser(User $user): void
    {
        $this->createQueryBuilder('n')
            ->delete()
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();
    }
}
