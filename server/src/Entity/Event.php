<?php

namespace App\Entity;

use App\Repository\EventRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EventRepository::class)]
#[ORM\Table(name: 'events')]
class Event
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $description;

    #[ORM\Column(type: 'date')]
    private \DateTimeInterface $date;

    #[ORM\Column(type: 'string', length: 10)]
    private string $time;

    #[ORM\Column(type: 'string', length: 255)]
    private string $location;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $lat = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $lng = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $category;

    #[ORM\Column(type: 'string', length: 50)]
    private string $image = '🐾';

    #[ORM\Column(type: 'boolean')]
    private bool $isPrivate = false;

    #[ORM\Column(type: 'boolean')]
    private bool $requiresApproval = false;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $maxAttendees = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $conversationId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $organizer;

    /** @var Collection<int, EventAttendee> */
    #[ORM\OneToMany(mappedBy: 'event', targetEntity: EventAttendee::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $attendees;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->attendees = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $d): self { $this->description = $d; return $this; }

    public function getDate(): \DateTimeInterface { return $this->date; }
    public function setDate(\DateTimeInterface $date): self { $this->date = $date; return $this; }

    public function getTime(): string { return $this->time; }
    public function setTime(string $time): self { $this->time = $time; return $this; }

    public function getLocation(): string { return $this->location; }
    public function setLocation(string $l): self { $this->location = $l; return $this; }

    public function getLat(): ?float { return $this->lat; }
    public function setLat(?float $lat): self { $this->lat = $lat; return $this; }

    public function getLng(): ?float { return $this->lng; }
    public function setLng(?float $lng): self { $this->lng = $lng; return $this; }

    public function getCategory(): string { return $this->category; }
    public function setCategory(string $c): self { $this->category = $c; return $this; }

    public function getImage(): string { return $this->image; }
    public function setImage(string $img): self { $this->image = $img; return $this; }

    public function isPrivate(): bool { return $this->isPrivate; }
    public function setIsPrivate(bool $p): self { $this->isPrivate = $p; return $this; }

    public function requiresApproval(): bool { return $this->requiresApproval; }
    public function setRequiresApproval(bool $r): self { $this->requiresApproval = $r; return $this; }

    public function getMaxAttendees(): ?int { return $this->maxAttendees; }
    public function setMaxAttendees(?int $m): self { $this->maxAttendees = $m; return $this; }

    public function getConversationId(): ?int { return $this->conversationId; }
    public function setConversationId(?int $id): self { $this->conversationId = $id; return $this; }

    public function getOrganizer(): User { return $this->organizer; }
    public function setOrganizer(User $u): self { $this->organizer = $u; return $this; }

    /** @return Collection<int, EventAttendee> */
    public function getAttendees(): Collection { return $this->attendees; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    /**
     * Sérialise l'événement en tableau pour l'API JSON.
     */
    public function toArray(?User $currentUser = null): array
    {
        $accepted    = $this->attendees->filter(fn(EventAttendee $a) => $a->getStatus() === 'accepted');
        $attendeeIds = array_values($accepted->map(fn(EventAttendee $a) => $a->getUser()->getId())->toArray());
        $count       = count($attendeeIds);
        $isFull      = $this->maxAttendees !== null && $count >= $this->maxAttendees;

        $currentUserStatus = null;
        if ($currentUser) {
            foreach ($this->attendees as $att) {
                if ($att->getUser()->getId() === $currentUser->getId()) {
                    $currentUserStatus = $att->getStatus();
                    break;
                }
            }
        }

        // Récupérer le nom de l'organisateur (Owner ou Sitter)
        $organizerName  = $this->organizer->getEmail(); // fallback
        $organizerPhoto = null;
        if (method_exists($this->organizer, 'getOwner') && $this->organizer->getOwner()) {
            $owner = $this->organizer->getOwner();
            $organizerName  = $owner->getFullName();
            $organizerPhoto = $owner->getPhotoPath();
        }

        return [
            'id'                => $this->id,
            'title'             => $this->title,
            'description'       => $this->description,
            'date'              => $this->date->format('Y-m-d'),
            'time'              => $this->time,
            'location'          => $this->location,
            'lat'               => $this->lat,
            'lng'               => $this->lng,
            'category'          => $this->category,
            'image'             => $this->image,
            'isPrivate'         => $this->isPrivate,
            'requiresApproval'  => $this->requiresApproval,
            'maxAttendees'      => $this->maxAttendees,
            'organizerId'       => $this->organizer->getId(),
            'organizerName'     => $organizerName,
            'organizerPhoto'    => $organizerPhoto,
            'attendees'         => $count,
            'attendeesList'     => $attendeeIds,
            'isFull'            => $isFull,
            'conversationId'    => $this->conversationId,
            'currentUserStatus' => $currentUserStatus,
            'createdAt'         => $this->createdAt->format('c'),
        ];
    }
}
