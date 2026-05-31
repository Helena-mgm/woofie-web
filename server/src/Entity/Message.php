<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\MessageRepository')]
#[ORM\Table(name: 'messages')]
#[ORM\Index(name: 'idx_conversation', columns: ['conversation_id'])]
#[ORM\Index(name: 'idx_sender', columns: ['sender_id'])]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Conversation::class, inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Conversation $conversation;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $sender = null;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(type: 'string', length: 20)]
    private string $type = 'text'; // text, image, file, audio, video, bot

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    // TODO: Uncomment when reply_to column is added to database
    // #[ORM\ManyToOne(targetEntity: Message::class)]
    // #[ORM\JoinColumn(onDelete: 'SET NULL')]
    // private ?Message $replyTo = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getConversation(): Conversation { return $this->conversation; }
    public function setConversation(Conversation $conversation): self { 
        $this->conversation = $conversation; 
        return $this; 
    }
    public function getSender(): ?User { return $this->sender; }
    public function setSender(?User $sender): self { $this->sender = $sender; return $this; }
    public function getContent(): string { return $this->content; }
    public function setContent(string $content): self { $this->content = $content; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function isRead(): bool { return $this->isRead; }
    public function setIsRead(bool $isRead): self { $this->isRead = $isRead; return $this; }
    // TODO: Uncomment when reply_to column is added
    // public function getReplyTo(): ?Message { return $this->replyTo; }
    // public function setReplyTo(?Message $replyTo): self { $this->replyTo = $replyTo; return $this; }
}
