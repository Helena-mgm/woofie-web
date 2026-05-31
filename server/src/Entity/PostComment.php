<?php

namespace App\Entity;

use App\Repository\PostCommentRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PostCommentRepository::class)]
#[ORM\Table(name: 'post_comments')]
class PostComment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Post $post = null;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    // Self-referencing for nested replies
    #[ORM\ManyToOne(targetEntity: PostComment::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?PostComment $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: PostComment::class, cascade: ['persist', 'remove'])]
    private Collection $replies;

    #[ORM\OneToMany(mappedBy: 'comment', targetEntity: PostCommentLike::class, cascade: ['persist', 'remove'])]
    private Collection $likes;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->replies = new ArrayCollection();
        $this->likes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getPost(): ?Post
    {
        return $this->post;
    }

    public function setPost(?Post $post): self
    {
        $this->post = $post;
        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getParent(): ?PostComment
    {
        return $this->parent;
    }

    public function setParent(?PostComment $parent): self
    {
        $this->parent = $parent;
        return $this;
    }

    /**
     * @return Collection<int, PostComment>
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }

    public function addReply(PostComment $reply): self
    {
        if (!$this->replies->contains($reply)) {
            $this->replies[] = $reply;
            $reply->setParent($this);
        }
        return $this;
    }

    public function removeReply(PostComment $reply): self
    {
        if ($this->replies->removeElement($reply)) {
            if ($reply->getParent() === $this) {
                $reply->setParent(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, PostCommentLike>
     */
    public function getLikes(): Collection
    {
        return $this->likes;
    }

    public function getLikesCount(): int
    {
        return $this->likes->count();
    }

    public function isLikedByUser(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        foreach ($this->likes as $like) {
            if ($like->getUser()->getId() === $user->getId()) {
                return true;
            }
        }

        return false;
    }
}
