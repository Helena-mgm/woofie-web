<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'group_members')]
#[ORM\UniqueConstraint(name: 'group_user_unique', columns: ['group_id', 'user_id'])]
class GroupMember
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Group::class, inversedBy: 'members')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Group $group;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: 'string', length: 20)]
    private string $role = 'member'; // owner, admin, member

    #[ORM\Column(type: 'boolean')]
    private bool $canInvite = false;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $joinedAt;

    public function __construct()
    {
        $this->joinedAt = new \DateTime();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getGroup(): Group { return $this->group; }
    public function setGroup(Group $group): self { $this->group = $group; return $this; }
    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
    public function getRole(): string { return $this->role; }
    public function setRole(string $role): self { $this->role = $role; return $this; }
    public function canInvite(): bool { return $this->canInvite; }
    public function setCanInvite(bool $canInvite): self { 
        $this->canInvite = $canInvite; 
        return $this; 
    }
    public function getJoinedAt(): \DateTimeInterface { return $this->joinedAt; }
}
