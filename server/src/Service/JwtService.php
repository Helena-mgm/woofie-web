<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\HttpFoundation\Request;

class JwtService
{
    public const COOKIE_NAME = 'woofie_token';

    private string $secret;

    public function __construct(
        private UserRepository $userRepository,
        string $jwtSecret,
        private int $jwtTtlSeconds
    ) {
        $secret = trim($jwtSecret);

        if ($secret === '' || strlen($secret) < 32) {
            throw new \RuntimeException('JWT_SECRET must be configured with at least 32 characters.');
        }
        if ($this->jwtTtlSeconds < 1) {
            throw new \RuntimeException('JWT_TTL_SECONDS must be greater than zero.');
        }

        $this->secret = $secret;
    }

    public function createToken(User $user): string
    {
        $now = time();

        return JWT::encode([
            'sub' => $user->getId(),
            'email' => $user->getEmail(),
            'type' => $user->getType(),
            'iat' => $now,
            'exp' => $now + $this->jwtTtlSeconds,
        ], $this->secret, 'HS256');
    }

    public function decode(string $token): object
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }

    public function getTokenFromRequest(Request $request): ?string
    {
        $authHeader = $request->headers->get('Authorization');
        if ($authHeader && preg_match('/^Bearer\s+(\S+)$/', $authHeader, $matches) === 1) {
            return $matches[1];
        }

        return $request->cookies->get(self::COOKIE_NAME);
    }

    public function getUserFromRequest(Request $request): ?User
    {
        $token = $this->getTokenFromRequest($request);
        if (!$token) {
            return null;
        }

        try {
            $decoded = $this->decode($token);
            if (!isset($decoded->sub) || !is_numeric($decoded->sub)) {
                return null;
            }

            $user = $this->userRepository->find((int) $decoded->sub);

            if ($user && $user->isBanned()) {
                return null;
            }

            return $user;
        } catch (\Throwable) {
            return null;
        }
    }
}
