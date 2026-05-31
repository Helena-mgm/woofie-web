<?php

namespace App\Repository;

use App\Entity\Sitter;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Sitter>
 */
class SitterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Sitter::class);
    }

    /**
     * Trouve tous les sitters en attente de vérification
     *
     * @return Sitter[]
     */
    public function findPending(): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.isVerified = :verified')
            ->setParameter('verified', false)
            ->orderBy('s.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve tous les sitters vérifiés
     *
     * @return Sitter[]
     */
    public function findVerified(): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.isVerified = :verified')
            ->setParameter('verified', true)
            ->orderBy('s.verifiedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve un sitter par numéro SIRET
     */
    public function findBySiret(string $siret): ?Sitter
    {
        return $this->createQueryBuilder('s')
            ->where('s.siret = :siret')
            ->setParameter('siret', $siret)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve un sitter par numéro de téléphone
     */
    public function findByTelephone(string $telephone): ?Sitter
    {
        return $this->createQueryBuilder('s')
            ->where('s.telephone = :telephone')
            ->setParameter('telephone', $telephone)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
