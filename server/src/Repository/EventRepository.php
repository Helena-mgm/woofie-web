<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    /** Événements à venir, filtrés selon la visibilité de l'utilisateur. */
    public function findUpcoming(\DateTimeInterface $today, ?User $user): array
    {
        $all = $this->createQueryBuilder('e')
            ->leftJoin('e.attendees', 'a')
            ->addSelect('a')
            ->where('e.date >= :today')
            ->setParameter('today', $today->format('Y-m-d'))
            ->orderBy('e.date', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->filterByVisibility($all, $user);
    }

    /** Événements passés (max 20), filtrés selon la visibilité. */
    public function findPast(\DateTimeInterface $today, ?User $user): array
    {
        $all = $this->createQueryBuilder('e')
            ->leftJoin('e.attendees', 'a')
            ->addSelect('a')
            ->where('e.date < :today')
            ->setParameter('today', $today->format('Y-m-d'))
            ->orderBy('e.date', 'DESC')
            ->setMaxResults(20)
            ->getQuery()
            ->getResult();

        return $this->filterByVisibility($all, $user);
    }

    /** Garde les événements publics + les événements privés accessibles à cet utilisateur. */
    private function filterByVisibility(array $events, ?User $user): array
    {
        if (!$user) {
            return array_values(array_filter($events, fn(Event $e) => !$e->isPrivate()));
        }

        return array_values(array_filter($events, function (Event $e) use ($user): bool {
            if (!$e->isPrivate()) return true;
            if ($e->getOrganizer()->getId() === $user->getId()) return true;
            foreach ($e->getAttendees() as $att) {
                if ($att->getUser()->getId() === $user->getId()) return true;
            }
            return false;
        }));
    }
}
