<?php

namespace App\Security;

use App\Repository\UserRepository;
use App\Service\JwtService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class JwtAuthenticator extends AbstractAuthenticator
{
    private const PUBLIC_MUTATIONS = [
        '/api/login',
        '/api/register',
        '/api/logout',
    ];

    public function __construct(
        private UserRepository $userRepository,
        private JwtService $jwtService
    ) {
    }

    public function supports(Request $request): ?bool
    {
        if ($this->isPublicRequest($request)) {
            return false;
        }

        $authHeader = $request->headers->get('Authorization');

        return ($authHeader !== null && preg_match('/^Bearer\s+\S+$/', $authHeader) === 1)
            || $request->cookies->has(JwtService::COOKIE_NAME);
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');

        if ($authHeader && preg_match('/^Bearer\s+(\S+)$/', $authHeader, $matches) === 1) {
            $token = $matches[1];
        } else {
            $token = $request->cookies->get(JwtService::COOKIE_NAME);
        }

        if (!$token) {
            throw new CustomUserMessageAuthenticationException('No API token provided');
        }

        try {
            $decoded = $this->jwtService->decode($token);
            
            if (!isset($decoded->sub) || !is_numeric($decoded->sub)) {
                throw new CustomUserMessageAuthenticationException('Invalid token payload');
            }

            $userId = (int) $decoded->sub;

            return new SelfValidatingPassport(
                new UserBadge((string) $userId, function(string $userIdentifier) {
                    $user = $this->userRepository->find((int) $userIdentifier);
                    
                    if (!$user) {
                        throw new CustomUserMessageAuthenticationException('User not found');
                    }
                    
                    return $user;
                })
            );
        } catch (\Throwable) {
            throw new CustomUserMessageAuthenticationException('Invalid token');
        }
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'error' => 'Unauthorized'
        ], Response::HTTP_UNAUTHORIZED);
    }

    private function isPublicRequest(Request $request): bool
    {
        $path = $request->getPathInfo();

        if (in_array($path, self::PUBLIC_MUTATIONS, true)) {
            return true;
        }

        if ($request->getMethod() !== 'GET') {
            return false;
        }

        return preg_match('#^/api/(?:events(?:/\d+(?:/attendees)?)?|posts|sitters|siret/[^/]+|dogs/lost|profile/\d+|dog/\d+|locations|pois)$#', $path) === 1;
    }
}
