<?php

namespace App\Security;

use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
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
    private string $jwtSecret;

    public function __construct(
        private UserRepository $userRepository
    ) {
        $this->jwtSecret = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    public function supports(Request $request): ?bool
    {
        // Only authenticate requests with Authorization header
        return $request->headers->has('Authorization');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');
        
        error_log("[JwtAuth] Path: " . $request->getPathInfo());
        error_log("[JwtAuth] Authorization header: " . ($authHeader ? 'Present' : 'MISSING'));
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            error_log("[JwtAuth] No Bearer token found");
            throw new CustomUserMessageAuthenticationException('No API token provided');
        }

        $token = substr($authHeader, 7); // Remove "Bearer "
        error_log("[JwtAuth] Token extracted: " . substr($token, 0, 20) . "...");

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            if (!isset($decoded->email)) {
                error_log("[JwtAuth] Token missing email field");
                throw new CustomUserMessageAuthenticationException('Invalid token payload');
            }

            $userEmail = $decoded->email;
            error_log("[JwtAuth] User email from token: " . $userEmail);

            return new SelfValidatingPassport(
                new UserBadge($userEmail, function($userIdentifier) {
                    $user = $this->userRepository->findOneBy(['email' => $userIdentifier]);
                    
                    if (!$user) {
                        error_log("[JwtAuth] User not found: " . $userIdentifier);
                        throw new CustomUserMessageAuthenticationException('User not found');
                    }
                    
                    error_log("[JwtAuth] User authenticated: " . $user->getEmail());
                    return $user;
                })
            );
        } catch (\Exception $e) {
            error_log("[JwtAuth] Token decode error: " . $e->getMessage());
            throw new CustomUserMessageAuthenticationException('Invalid token: ' . $e->getMessage());
        }
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        // Let the request continue
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'error' => $exception->getMessage()
        ], Response::HTTP_UNAUTHORIZED);
    }
}
