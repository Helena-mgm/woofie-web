<?php

namespace App\Entity;

use App\Repository\DogRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: DogRepository::class)]
#[ORM\Table(name: 'dogs')]
class Dog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    #[Assert\NotBlank(message: 'Le nom du chien est requis')]
    #[Assert\Length(min: 2, max: 100)]
    private string $nom;

    #[ORM\Column(type: 'string', length: 50, unique: true)]
    #[Assert\NotBlank(message: 'Le numéro ICAD est requis')]
    #[Assert\Regex(
        pattern: '/^(\d{15}|[A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/',
        message: 'Format ICAD invalide (15 chiffres ou tatouage ABC123/123456ABC)'
    )]
    private string $icadNumber;

    #[ORM\Column(type: 'string', length: 20)]
    #[Assert\Choice(choices: ['microchip', 'tattoo'], message: 'Type ICAD doit être microchip ou tattoo')]
    private string $icadType;

    #[ORM\ManyToOne(targetEntity: Owner::class, inversedBy: 'dogs')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Owner $owner = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $race = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateNaissance = null;

    #[ORM\Column(type: 'string', length: 10, nullable: true)]
    #[Assert\Choice(choices: ['M', 'F'], message: 'Le sexe doit être M ou F')]
    private ?string $sexe = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $photoPath = null;

    #[ORM\OneToMany(mappedBy: 'dog', targetEntity: DogPhoto::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['displayOrder' => 'ASC'])]
    private Collection $photos;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->photos = new ArrayCollection();
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): string
    {
        return $this->nom;
    }

    public function setNom(string $nom): self
    {
        $this->nom = $nom;
        return $this;
    }

    public function getIcadNumber(): string
    {
        return $this->icadNumber;
    }

    public function setIcadNumber(string $icadNumber): self
    {
        $this->icadNumber = $icadNumber;
        return $this;
    }

    public function getIcadType(): string
    {
        return $this->icadType;
    }

    public function setIcadType(string $icadType): self
    {
        $this->icadType = $icadType;
        return $this;
    }

    public function getOwner(): ?Owner
    {
        return $this->owner;
    }

    public function setOwner(?Owner $owner): self
    {
        $this->owner = $owner;
        return $this;
    }

    public function getRace(): ?string
    {
        return $this->race;
    }

    public function setRace(?string $race): self
    {
        $this->race = $race;
        return $this;
    }

    public function getDateNaissance(): ?\DateTimeInterface
    {
        return $this->dateNaissance;
    }

    public function setDateNaissance(?\DateTimeInterface $dateNaissance): self
    {
        $this->dateNaissance = $dateNaissance;
        return $this;
    }

    public function getSexe(): ?string
    {
        return $this->sexe;
    }

    public function setSexe(?string $sexe): self
    {
        $this->sexe = $sexe;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getPhotoPath(): ?string
    {
        return $this->photoPath;
    }

    public function setPhotoPath(?string $photoPath): self
    {
        $this->photoPath = $photoPath;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, DogPhoto>
     */
    public function getPhotos(): Collection
    {
        return $this->photos;
    }

    public function addPhoto(DogPhoto $photo): self
    {
        if (!$this->photos->contains($photo)) {
            $this->photos->add($photo);
            $photo->setDog($this);
        }
        return $this;
    }

    public function removePhoto(DogPhoto $photo): self
    {
        if ($this->photos->removeElement($photo)) {
            if ($photo->getDog() === $this) {
                $photo->setDog(null);
            }
        }
        return $this;
    }
}
