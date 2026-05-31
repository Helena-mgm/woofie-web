<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: 'App\Repository\ConversationRepository')]
#[ORM\Table(name: 'conversations')]
class Conversation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $type; // 'direct', 'group', or 'bot'

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'conversation_participants')]
    private Collection $participants;

    #[ORM\OneToMany(mappedBy: 'conversation', targetEntity: Message::class, cascade: ['remove'])]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $messages;

    public function __construct()
    {
        $this->participants = new ArrayCollection();
        $this->messages = new ArrayCollection();
        $this->createdAt = new \DateTime();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }
    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): self { $this->name = $name; return $this; }
    public function getAvatar(): ?string { return $this->avatar; }
    public function setAvatar(?string $avatar): self { $this->avatar = $avatar; return $this; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getParticipants(): Collection { return $this->participants; }
    public function addParticipant(User $user): self {
        if (!$this->participants->contains($user)) {
            $this->participants[] = $user;
        }
        return $this;
    }
    public function removeParticipant(User $user): self {
        $this->participants->removeElement($user);
        return $this;
    }
    public function getMessages(): Collection { return $this->messages; }
    public function getLastMessage(): ?Message {
        return $this->messages->first() ?: null;
    }
}
