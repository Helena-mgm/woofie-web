<?php

namespace App\Repository;

use App\Entity\DogPhoto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DogPhoto>
 */
class DogPhotoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DogPhoto::class);
    }

    /**
     * Find all photos for a dog, ordered by display order
     */
    public function findByDogOrdered(int $dogId): array
    {
        return $this->createQueryBuilder('dp')
            ->andWhere('dp.dog = :dogId')
            ->setParameter('dogId', $dogId)
            ->orderBy('dp.displayOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
