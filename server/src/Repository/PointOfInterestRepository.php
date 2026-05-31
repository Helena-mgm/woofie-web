<?php

namespace App\Repository;

use App\Entity\PointOfInterest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PointOfInterest>
 *
 * @method PointOfInterest|null find($id, $lockMode = null, $lockVersion = null)
 * @method PointOfInterest|null findOneBy(array $criteria, array $orderBy = null)
 * @method PointOfInterest[]    findAll()
 * @method PointOfInterest[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PointOfInterestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PointOfInterest::class);
    }

    /**
     * @return PointOfInterest[]
     */
    public function findWithinBounds(float $south, float $west, float $north, float $east, int $limit = 200): array
    {
        return $this->createQueryBuilder('poi')
            ->andWhere('poi.latitude BETWEEN :south AND :north')
            ->andWhere('poi.longitude BETWEEN :west AND :east')
            ->setParameter('south', $south)
            ->setParameter('north', $north)
            ->setParameter('west', $west)
            ->setParameter('east', $east)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function upsert(PointOfInterest $poi): void
    {
        $this->getEntityManager()->persist($poi);
    }
}
