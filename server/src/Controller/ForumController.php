<?php

namespace App\Controller;

use App\Entity\Post;
use App\Entity\PostLike;
use App\Entity\PostComment;
use App\Entity\PostImage;
use App\Repository\PostRepository;
use App\Repository\ForbiddenKeywordRepository;
use App\Repository\DogRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/posts')]
class ForumController extends AbstractController
{
    private string $jwtKey;

    public function __construct(private EntityManagerInterface $em)
    {
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    private function getUserFromToken(Request $request, UserRepository $userRepository): ?\App\Entity\User
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtKey, 'HS256'));
            return $userRepository->find($decoded->sub);
        } catch (\Exception $e) {
            return null;
        }
    }

    #[Route('', name: 'app_forum_list', methods: ['GET'])]
    public function list(Request $request, PostRepository $postRepository, UserRepository $userRepository): JsonResponse
    {
        $limit = $request->query->getInt('limit', 20);
        $offset = $request->query->getInt('offset', 0);

        $posts = $postRepository->findRecent($limit, $offset);
        $currentUser = $this->getUserFromToken($request, $userRepository);

        $data = array_map(function (Post $post) use ($currentUser) {
            return $this->serializePost($post, $currentUser);
        }, $posts);

        return $this->json($data);
    }

    #[Route('', name: 'app_forum_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, DogRepository $dogRepository, UserRepository $userRepository, ForbiddenKeywordRepository $forbiddenRepo): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $content = $request->request->get('content');
        if (empty($content)) {
            return $this->json(['error' => 'Content is required'], Response::HTTP_BAD_REQUEST);
        }

        // Check forbidden keywords
        $keywords = $forbiddenRepo->getAllKeywords();
        foreach ($keywords as $kw) {
            if ($kw === '') {
                continue;
            }
            if (mb_stripos($content, $kw) !== false) {
                return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
            }
        }

        $post = new Post();
        $post->setUser($user);
        $post->setContent($content);

        // Handle dog tags
        $dogIds = json_decode($request->request->get('dogIds', '[]'), true);
        if ($dogIds) {
            foreach ($dogIds as $dogId) {
                $dog = $dogRepository->find($dogId);
                if ($dog) {
                    $post->addDog($dog);
                }
            }
        }

        // Handle images
        $uploadedFiles = $request->files->all();
        $displayOrder = 0;
        foreach ($uploadedFiles as $key => $file) {
            if (str_starts_with($key, 'image_')) {
                $filename = uniqid() . '.' . $file->guessExtension();
                $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/posts';
                
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0775, true);
                }
                
                $file->move($uploadDir, $filename);

                $postImage = new PostImage();
                $postImage->setPost($post);
                $postImage->setImagePath('/uploads/posts/' . $filename);
                $postImage->setDisplayOrder($displayOrder++);
                $em->persist($postImage);
            }
        }

        $em->persist($post);
        $em->flush();

        return $this->json($this->serializePost($post, $user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'app_forum_delete', methods: ['DELETE'])]
    public function delete(Post $post, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user || $post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        // Delete associated images from filesystem
        foreach ($post->getImages() as $image) {
            $imagePath = $this->getParameter('kernel.project_dir') . '/public' . $image->getImagePath();
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }

        $em->remove($post);
        $em->flush();

        return $this->json(['message' => 'Post deleted']);
    }

    #[Route('/{id}/like', name: 'app_forum_like', methods: ['POST'])]
    public function toggleLike(Post $post, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        // Check if already liked
        $existingLike = $em->getRepository(PostLike::class)->findOneBy([
            'post' => $post,
            'user' => $user
        ]);

        if ($existingLike) {
            // Unlike
            $em->remove($existingLike);
            $action = 'unliked';
        } else {
            // Like
            $like = new PostLike();
            $like->setPost($post);
            $like->setUser($user);
            $em->persist($like);
            $action = 'liked';
        }

        $em->flush();

        return $this->json([
            'action' => $action,
            'likesCount' => $post->getLikesCount(),
            'isLiked' => $post->isLikedByUser($user)
        ]);
    }

    #[Route('/{id}/comment', name: 'app_forum_comment', methods: ['POST'])]
    public function addComment(Post $post, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? '';

        if (empty($content)) {
            return $this->json(['error' => 'Content is required'], Response::HTTP_BAD_REQUEST);
        }

        // Check forbidden keywords
        $forbiddenRepo = $this->em->getRepository(\App\Entity\ForbiddenKeyword::class);
        $keywords = method_exists($forbiddenRepo, 'getAllKeywords') ? $forbiddenRepo->getAllKeywords() : [];
        foreach ($keywords as $kw) {
            if ($kw === '') {
                continue;
            }
            if (mb_stripos($content, $kw) !== false) {
                return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
            }
        }

        $comment = new PostComment();
        $comment->setPost($post);
        $comment->setUser($user);
        $comment->setContent($content);

        $em->persist($comment);
        $em->flush();

        return $this->json([
            'id' => $comment->getId(),
            'content' => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format('c'),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'owner' => $user->getOwner() ? [
                    'nom' => $user->getOwner()->getNom(),
                    'prenom' => $user->getOwner()->getPrenom(),
                    'fullName' => $user->getOwner()->getFullName(),
                ] : null
            ]
        ], Response::HTTP_CREATED);
    }

    #[Route('/{postId}/comments/{commentId}', name: 'app_forum_delete_comment', methods: ['DELETE'])]
    public function deleteComment(int $postId, int $commentId, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $em->getRepository(PostComment::class)->find($commentId);
        
        if (!$comment) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        if ($comment->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $em->remove($comment);
        $em->flush();

        return $this->json(['message' => 'Comment deleted']);
    }

    #[Route('/{postId}/comments/{commentId}/reply', name: 'app_forum_reply_comment', methods: ['POST'])]
    public function replyToComment(int $postId, int $commentId, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $post = $em->getRepository(Post::class)->find($postId);
        if (!$post) {
            return $this->json(['error' => 'Post not found'], Response::HTTP_NOT_FOUND);
        }

        $parentComment = $em->getRepository(PostComment::class)->find($commentId);
        if (!$parentComment) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? '';

        if (empty($content)) {
            return $this->json(['error' => 'Content is required'], Response::HTTP_BAD_REQUEST);
        }

        // Check forbidden keywords
        $forbiddenRepo = $this->em->getRepository(\App\Entity\ForbiddenKeyword::class);
        $keywords = method_exists($forbiddenRepo, 'getAllKeywords') ? $forbiddenRepo->getAllKeywords() : [];
        foreach ($keywords as $kw) {
            if ($kw === '') {
                continue;
            }
            if (mb_stripos($content, $kw) !== false) {
                return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
            }
        }

        $reply = new PostComment();
        $reply->setPost($post);
        $reply->setUser($user);
        $reply->setContent($content);
        $reply->setParent($parentComment);

        $em->persist($reply);
        $em->flush();

        return $this->json($this->serializeComment($reply, $user), Response::HTTP_CREATED);
    }

    #[Route('/{postId}/comments/{commentId}/like', name: 'app_forum_like_comment', methods: ['POST'])]
    public function likeComment(int $postId, int $commentId, Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $user = $this->getUserFromToken($request, $userRepository);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $em->getRepository(PostComment::class)->find($commentId);
        if (!$comment) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        // Check if user already liked this comment
        $existingLike = $em->getRepository(\App\Entity\PostCommentLike::class)->findOneBy([
            'user' => $user,
            'comment' => $comment
        ]);

        if ($existingLike) {
            // Unlike - remove the like
            $em->remove($existingLike);
            $em->flush();

            return $this->json([
                'isLiked' => false,
                'likesCount' => $comment->getLikesCount()
            ]);
        } else {
            // Like - create new like
            $like = new \App\Entity\PostCommentLike();
            $like->setUser($user);
            $like->setComment($comment);

            $em->persist($like);
            $em->flush();

            return $this->json([
                'isLiked' => true,
                'likesCount' => $comment->getLikesCount()
            ]);
        }
    }

    private function serializePost(Post $post, ?\App\Entity\User $currentUser = null): array
    {
        return [
            'id' => $post->getId(),
            'content' => $post->getContent(),
            'createdAt' => $post->getCreatedAt()->format('c'),
            'updatedAt' => $post->getUpdatedAt() ? $post->getUpdatedAt()->format('c') : null,
            'user' => [
                'id' => $post->getUser()->getId(),
                'email' => $post->getUser()->getEmail(),
                'isAdmin' => in_array('ROLE_ADMIN', $post->getUser()->getRoles(), true),
                'owner' => $post->getUser()->getOwner() ? [
                    'nom' => $post->getUser()->getOwner()->getNom(),
                    'prenom' => $post->getUser()->getOwner()->getPrenom(),
                    'fullName' => $post->getUser()->getOwner()->getFullName(),
                    'profilePicture' => $post->getUser()->getOwner()->getPhotoPath(),
                ] : null
            ],
            'images' => array_map(function (PostImage $image) {
                return [
                    'id' => $image->getId(),
                    'path' => $image->getImagePath(),
                    'displayOrder' => $image->getDisplayOrder()
                ];
            }, $post->getImages()->toArray()),
            'dogs' => array_map(function ($dog) {
                return [
                    'id' => $dog->getId(),
                    'name' => $dog->getNom(),
                    'breed' => $dog->getRace(),
                ];
            }, $post->getDogs()->toArray()),
            'likesCount' => $post->getLikesCount(),
            'isLiked' => $currentUser ? $post->isLikedByUser($currentUser) : false,
            'comments' => array_map(function (PostComment $comment) use ($currentUser) {
                // Only include top-level comments (no parent)
                return $comment->getParent() === null ? $this->serializeComment($comment, $currentUser) : null;
            }, array_filter($post->getComments()->toArray(), function (PostComment $comment) {
                return $comment->getParent() === null;
            }))
        ];
    }

    private function serializeComment(PostComment $comment, ?\App\Entity\User $currentUser = null): array
    {
        $parent = $comment->getParent();
        $parentData = null;
        
        if ($parent) {
            $parentData = [
                'id' => $parent->getId(),
                'user' => [
                    'id' => $parent->getUser()->getId(),
                    'email' => $parent->getUser()->getEmail(),
                    'nom' => $parent->getUser()->getOwner() ? $parent->getUser()->getOwner()->getNom() : 'Unknown',
                    'prenom' => $parent->getUser()->getOwner() ? $parent->getUser()->getOwner()->getPrenom() : null,
                    'fullName' => $parent->getUser()->getOwner() ? $parent->getUser()->getOwner()->getFullName() : 'Unknown',
                ]
            ];
        }

        return [
            'id' => $comment->getId(),
            'content' => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format('c'),
            'user' => [
                'id' => $comment->getUser()->getId(),
                'email' => $comment->getUser()->getEmail(),
                'isAdmin' => in_array('ROLE_ADMIN', $comment->getUser()->getRoles(), true),
                'owner' => $comment->getUser()->getOwner() ? [
                    'nom' => $comment->getUser()->getOwner()->getNom(),
                    'prenom' => $comment->getUser()->getOwner()->getPrenom(),
                    'fullName' => $comment->getUser()->getOwner()->getFullName(),
                ] : null
            ],
            'parent' => $parentData,
            'likesCount' => $comment->getLikesCount(),
            'isLiked' => $currentUser ? $comment->isLikedByUser($currentUser) : false,
            'replies' => array_map(function (PostComment $reply) use ($currentUser) {
                return $this->serializeComment($reply, $currentUser);
            }, $comment->getReplies()->toArray())
        ];
    }
}
