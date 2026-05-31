<?php

namespace App\Repository;

use App\Entity\Dog;
use App\Entity\Owner;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Dog>
 */
class DogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Dog::class);
    }

    /**
     * Trouve un chien par numéro ICAD
     */
    public function findByIcadNumber(string $icadNumber): ?Dog
    {
        return $this->createQueryBuilder('d')
            ->where('d.icadNumber = :icadNumber')
            ->setParameter('icadNumber', $icadNumber)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve tous les chiens d'un propriétaire
     *
     * @return Dog[]
     */
    public function findByOwner(Owner $owner): array
    {
        return $this->createQueryBuilder('d')
            ->where('d.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('d.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les chiens par type ICAD
     *
     * @return Dog[]
     */
    public function findByIcadType(string $type): array
    {
        return $this->createQueryBuilder('d')
            ->where('d.icadType = :type')
            ->setParameter('type', $type)
            ->orderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
