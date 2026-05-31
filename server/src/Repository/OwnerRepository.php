<?php

namespace App\Repository;

use App\Entity\Owner;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Owner>
 */
class OwnerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Owner::class);
    }

    /**
     * Trouve un owner par numéro de téléphone
     */
    public function findByTelephone(string $telephone): ?Owner
    {
        return $this->createQueryBuilder('o')
            ->where('o.telephone = :telephone')
            ->setParameter('telephone', $telephone)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les owners par ville
     *
     * @return Owner[]
     */
    public function findByVille(string $ville): array
    {
        return $this->createQueryBuilder('o')
            ->where('o.ville LIKE :ville')
            ->setParameter('ville', '%' . $ville . '%')
            ->orderBy('o.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
