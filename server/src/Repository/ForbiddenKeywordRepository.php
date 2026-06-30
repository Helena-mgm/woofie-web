<?php

namespace App\Repository;

use App\Entity\ForbiddenKeyword;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ForbiddenKeywordRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ForbiddenKeyword::class);
    }

    /**
     * Return all keywords as array of strings
     *
     * @return string[]
     */
    public function getAllKeywords(): array
    {
        $rows = $this->createQueryBuilder('k')
            ->select('k.keyword')
            ->getQuery()
            ->getArrayResult();

        return array_map(fn($r) => $r['keyword'], $rows);
    }
}
