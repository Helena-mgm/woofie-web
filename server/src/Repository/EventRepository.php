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

    private function filterByVisibility(array $events, ?User $user): array
    {
        if (!$user) {
            return array_values(array_filter($events, fn(Event $e) => !$e->isPrivate()));
        }

        return array_values(array_filter($events, function (Event $e) use ($user): bool {
            if (!$e->isPrivate()) return true;
            if ($e->getOrganizer()->getId() === $user->getId()) return true;
            foreach ($e->getAttendees() as $att) {
                if ($att->getUser()->getId() === $user->getId() && in_array($att->getStatus(), ['pending', 'accepted'], true)) return true;
            }
            return false;
        }));
    }
}
