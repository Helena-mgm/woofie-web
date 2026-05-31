<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blocked_users')]
#[ORM\UniqueConstraint(name: 'user_blocked_unique', columns: ['user_id', 'blocked_user_id'])]
class BlockedUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $blockedUser;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $blockedAt;

    public function __construct()
    {
        $this->blockedAt = new \DateTime();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
    public function getBlockedUser(): User { return $this->blockedUser; }
    public function setBlockedUser(User $blockedUser): self { 
        $this->blockedUser = $blockedUser; 
        return $this; 
    }
    public function getBlockedAt(): \DateTimeInterface { return $this->blockedAt; }
}
