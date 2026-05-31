<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

class JwtAuthenticationSubscriber implements EventSubscriberInterface
{
    private TokenStorageInterface $tokenStorage;
    private UserRepository $userRepository;
    private string $jwtKey;

    public function __construct(TokenStorageInterface $tokenStorage, UserRepository $userRepository)
    {
        $this->tokenStorage = $tokenStorage;
        $this->userRepository = $userRepository;
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $authHeader = $request->headers->get('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return;
        }

        $token = substr($authHeader, 7); // Remove "Bearer " prefix

        try {
            $decoded = JWT::decode($token, new Key($this->jwtKey, 'HS256'));
            
            // Find user by ID from token
            $user = $this->userRepository->find($decoded->sub);
            
            if ($user) {
                // Create authentication token and set it
                $authToken = new UsernamePasswordToken(
                    $user,
                    'main',
                    $user->getRoles()
                );
                
                $this->tokenStorage->setToken($authToken);
            }
        } catch (\Exception $e) {
            // Invalid token, do nothing (user stays unauthenticated)
        }
    }
}
