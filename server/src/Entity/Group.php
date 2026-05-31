<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'groups')]
class Group
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    private int $id; // Same as conversation_id

    #[ORM\OneToOne(targetEntity: Conversation::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Conversation $conversation;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $owner;

    #[ORM\Column(type: 'boolean')]
    private bool $allowMemberInvites = false;

    #[ORM\Column(type: 'boolean')]
    private bool $allowMemberMessages = true;

    #[ORM\Column(type: 'boolean')]
    private bool $isPrivate = false;

    #[ORM\OneToMany(mappedBy: 'group', targetEntity: GroupMember::class, cascade: ['remove'])]
    private Collection $members;

    public function __construct()
    {
        $this->members = new ArrayCollection();
    }

    // Getters & Setters
    public function getId(): int { return $this->id; }
    public function setId(int $id): self { $this->id = $id; return $this; }
    public function getConversation(): Conversation { return $this->conversation; }
    public function setConversation(Conversation $conversation): self { 
        $this->conversation = $conversation; 
        $this->id = $conversation->getId();
        return $this; 
    }
    public function getOwner(): User { return $this->owner; }
    public function setOwner(User $owner): self { $this->owner = $owner; return $this; }
    public function isAllowMemberInvites(): bool { return $this->allowMemberInvites; }
    public function setAllowMemberInvites(bool $allow): self { 
        $this->allowMemberInvites = $allow; 
        return $this; 
    }
    public function isAllowMemberMessages(): bool { return $this->allowMemberMessages; }
    public function setAllowMemberMessages(bool $allow): self { 
        $this->allowMemberMessages = $allow; 
        return $this; 
    }
    public function isPrivate(): bool { return $this->isPrivate; }
    public function setIsPrivate(bool $isPrivate): self { 
        $this->isPrivate = $isPrivate; 
        return $this; 
    }
    public function getMembers(): Collection { return $this->members; }
    
    public function getAdmins(): array {
        return $this->members->filter(fn($m) => $m->getRole() === 'admin')->toArray();
    }
}
