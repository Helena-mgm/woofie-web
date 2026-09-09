<?php

namespace App\Controller;

use App\Entity\Post;
use App\Entity\PostLike;
use App\Entity\PostComment;
use App\Entity\PostImage;
use App\Entity\PostCommentLike;
use App\Entity\Sitter;
use App\Entity\User;
use App\Repository\PostRepository;
use App\Repository\ForbiddenKeywordRepository;
use App\Repository\DogRepository;
use App\Service\ImageUploadService;
use App\Service\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/posts')]
class ForumController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ImageUploadService $imageUploadService,
        private JwtService $jwtService
    )
    {
    }

    private function getUserFromToken(Request $request): ?\App\Entity\User
    {
        return $this->jwtService->getUserFromRequest($request);
    }

    #[Route('', name: 'app_forum_list', methods: ['GET'])]
    public function list(Request $request, PostRepository $postRepository): JsonResponse
    {
        $limit = min(50, max(1, $request->query->getInt('limit', 20)));
        $offset = min(10000, max(0, $request->query->getInt('offset', 0)));

        $posts = $postRepository->findRecent($limit, $offset);
        $currentUser = $this->getUserFromToken($request);

        $data = array_map(function (Post $post) use ($currentUser) {
            return $this->serializePost($post, $currentUser);
        }, $posts);

        return $this->json($data);
    }

    #[Route('', name: 'app_forum_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, DogRepository $dogRepository, ForbiddenKeywordRepository $forbiddenRepo): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $content = $request->request->get('content');
        if (!is_string($content) || trim($content) === '' || mb_strlen($content) > 5000) {
            return $this->json(['error' => 'Content is required'], Response::HTTP_BAD_REQUEST);
        }
        $content = trim($content);

        if ($this->containsForbiddenKeyword($content, $forbiddenRepo)) {
            return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
        }

        $post = new Post();
        $post->setUser($user);
        $post->setContent($content);

        $dogIdsRaw = $request->request->get('dogIds', '[]');
        if (!is_string($dogIdsRaw)) {
            return $this->json(['error' => 'dogIds invalide'], Response::HTTP_BAD_REQUEST);
        }
        $dogIds = json_decode($dogIdsRaw, true);
        if (!is_array($dogIds) || count($dogIds) > 10) {
            return $this->json(['error' => 'dogIds invalide'], Response::HTTP_BAD_REQUEST);
        }
        if ($dogIds !== []) {
            foreach ($dogIds as $dogId) {
                if (!is_int($dogId) && !ctype_digit((string) $dogId)) {
                    return $this->json(['error' => 'dogIds invalide'], Response::HTTP_BAD_REQUEST);
                }
                $dog = $dogRepository->find((int) $dogId);
                if (!$dog || $dog->getOwner()?->getUser()?->getId() !== $user->getId()) {
                    return $this->json(['error' => 'dogIds invalide'], Response::HTTP_BAD_REQUEST);
                }
                $post->addDog($dog);
            }
        }

        $imageFiles = [];
        foreach ($request->files->all() as $key => $file) {
            if (str_starts_with($key, 'image_')) {
                if (!$file instanceof UploadedFile) {
                    return $this->json(['error' => 'Image invalide'], Response::HTTP_BAD_REQUEST);
                }
                $imageFiles[] = $file;
            }
        }
        if (count($imageFiles) > 5) {
            return $this->json(['error' => 'Maximum 5 images par post'], Response::HTTP_BAD_REQUEST);
        }

        $uploadedPaths = [];
        try {
            foreach ($imageFiles as $displayOrder => $file) {
                $uploadDir = (string) $this->getParameter('kernel.project_dir') . '/public/uploads/posts';
                $imagePath = $this->imageUploadService->storeUploadedImage($file, $uploadDir, '/uploads/posts');
                $uploadedPaths[] = $imagePath;

                $postImage = new PostImage();
                $postImage->setPost($post);
                $postImage->setImagePath($imagePath);
                $postImage->setDisplayOrder($displayOrder);
                $em->persist($postImage);
            }

            $em->persist($post);
            $em->flush();
        } catch (\RuntimeException) {
            $this->removeUploadedFiles($uploadedPaths);
            return $this->json(['error' => 'Image invalide'], Response::HTTP_BAD_REQUEST);
        } catch (\Throwable $exception) {
            $this->removeUploadedFiles($uploadedPaths);
            error_log('[ForumController::create] ' . $exception::class);
            return $this->json(['error' => 'Publication impossible'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json($this->serializePost($post, $user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'app_forum_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Post $post, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId() && !$user->isAdmin()) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $imagePaths = array_map(static fn(PostImage $image): string => $image->getImagePath(), $post->getImages()->toArray());

        $em->remove($post);
        $em->flush();
        $this->removeUploadedFiles($imagePaths);

        return $this->json(['message' => 'Post deleted']);
    }

    #[Route('/{id}/like', name: 'app_forum_like', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function toggleLike(Post $post, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $existingLike = $em->getRepository(PostLike::class)->findOneBy([
            'post' => $post,
            'user' => $user
        ]);

        if ($existingLike) {
            $em->remove($existingLike);
            $action = 'unliked';
        } else {
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

    #[Route('/{id}/comment', name: 'app_forum_comment', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addComment(
        Post $post,
        Request $request,
        EntityManagerInterface $em,
        ForbiddenKeywordRepository $forbiddenRepo
    ): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $content = is_array($data) && is_string($data['content'] ?? null)
            ? trim($data['content'])
            : '';

        if ($content === '' || mb_strlen($content) > 2000) {
            return $this->json(['error' => 'Commentaire invalide'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->containsForbiddenKeyword($content, $forbiddenRepo)) {
            return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
        }

        $comment = new PostComment();
        $comment->setPost($post);
        $comment->setUser($user);
        $comment->setContent($content);

        $em->persist($comment);
        $em->flush();

        return $this->json($this->serializeComment($comment, $user), Response::HTTP_CREATED);
    }

    #[Route('/{postId}/comments/{commentId}', name: 'app_forum_delete_comment', methods: ['DELETE'], requirements: ['postId' => '\d+', 'commentId' => '\d+'])]
    public function deleteComment(int $postId, int $commentId, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $em->getRepository(PostComment::class)->find($commentId);
        
        if (!$comment) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        if ($comment->getPost()?->getId() !== $postId) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        if ($comment->getUser()->getId() !== $user->getId() && !$user->isAdmin()) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_FORBIDDEN);
        }

        $em->remove($comment);
        $em->flush();

        return $this->json(['message' => 'Comment deleted']);
    }

    #[Route('/{postId}/comments/{commentId}/reply', name: 'app_forum_reply_comment', methods: ['POST'], requirements: ['postId' => '\d+', 'commentId' => '\d+'])]
    public function replyToComment(
        int $postId,
        int $commentId,
        Request $request,
        EntityManagerInterface $em,
        ForbiddenKeywordRepository $forbiddenRepo
    ): JsonResponse
    {
        $user = $this->getUserFromToken($request);
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

        if ($parentComment->getPost()?->getId() !== $post->getId()) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $content = is_array($data) && is_string($data['content'] ?? null)
            ? trim($data['content'])
            : '';

        if ($content === '' || mb_strlen($content) > 2000) {
            return $this->json(['error' => 'Commentaire invalide'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->containsForbiddenKeyword($content, $forbiddenRepo)) {
            return $this->json(['error' => 'Content contains forbidden keyword'], Response::HTTP_FORBIDDEN);
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

    #[Route('/{postId}/comments/{commentId}/like', name: 'app_forum_like_comment', methods: ['POST'], requirements: ['postId' => '\d+', 'commentId' => '\d+'])]
    public function likeComment(int $postId, int $commentId, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $em->getRepository(PostComment::class)->find($commentId);
        if (!$comment) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        if ($comment->getPost()?->getId() !== $postId) {
            return $this->json(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        $existingLike = $em->getRepository(PostCommentLike::class)->findOneBy([
            'user' => $user,
            'comment' => $comment
        ]);

        if ($existingLike) {
            $em->remove($existingLike);
            $em->flush();

            return $this->json([
                'isLiked' => false,
                'likesCount' => $comment->getLikesCount()
            ]);
        }

        $like = new PostCommentLike();
        $like->setUser($user);
        $like->setComment($comment);

        $em->persist($like);
        $em->flush();

        return $this->json([
            'isLiked' => true,
            'likesCount' => $comment->getLikesCount()
        ]);
    }

    private function serializePost(Post $post, ?\App\Entity\User $currentUser = null): array
    {
        return [
            'id' => $post->getId(),
            'content' => $post->getContent(),
            'createdAt' => $post->getCreatedAt()->format('c'),
            'updatedAt' => $post->getUpdatedAt() ? $post->getUpdatedAt()->format('c') : null,
            'user' => $this->serializePublicUser($post->getUser()),
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
                return $comment->getParent() === null ? $this->serializeComment($comment, $currentUser) : null;
            }, array_filter($post->getComments()->toArray(), function (PostComment $comment) {
                return $comment->getParent() === null;
            }))
        ];
    }

    private function serializeComment(PostComment $comment, ?User $currentUser = null, int $depth = 0): array
    {
        $parent = $comment->getParent();
        $parentData = null;
        
        if ($parent) {
            $parentData = [
                'id' => $parent->getId(),
                'user' => $this->serializePublicUser($parent->getUser())
            ];
        }

        return [
            'id' => $comment->getId(),
            'content' => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format('c'),
            'user' => $this->serializePublicUser($comment->getUser()),
            'parent' => $parentData,
            'likesCount' => $comment->getLikesCount(),
            'isLiked' => $currentUser ? $comment->isLikedByUser($currentUser) : false,
            'replies' => $depth >= 3 ? [] : array_map(function (PostComment $reply) use ($currentUser, $depth) {
                return $this->serializeComment($reply, $currentUser, $depth + 1);
            }, $comment->getReplies()->toArray())
        ];
    }

    private function serializePublicUser(User $user): array
    {
        $owner = $user->getOwner();
        $sitter = $user->getType() === 'sitter'
            ? $this->em->getRepository(Sitter::class)->findOneBy(['user' => $user])
            : null;
        $name = $owner?->getFullName()
            ?? ($sitter ? trim($sitter->getPrenom() . ' ' . $sitter->getNom()) : 'Membre Woofie');
        $profilePicture = $owner?->getPhotoPath() ?? $sitter?->getPhotoPath();

        return [
            'id' => $user->getId(),
            'name' => $name,
            'profilePicture' => $profilePicture,
            'isAdmin' => $user->isAdmin(),
            'owner' => $owner ? [
                'nom' => $owner->getNom(),
                'prenom' => $owner->getPrenom(),
                'fullName' => $owner->getFullName(),
                'profilePicture' => $owner->getPhotoPath(),
            ] : null,
        ];
    }

    private function containsForbiddenKeyword(string $content, ForbiddenKeywordRepository $repository): bool
    {
        foreach ($repository->getAllKeywords() as $keyword) {
            if ($keyword !== '' && mb_stripos($content, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    private function removeUploadedFiles(array $paths): void
    {
        $publicDir = (string) $this->getParameter('kernel.project_dir') . '/public';
        foreach ($paths as $path) {
            if (is_string($path) && str_starts_with($path, '/uploads/posts/')) {
                @unlink($publicDir . $path);
            }
        }
    }
}
