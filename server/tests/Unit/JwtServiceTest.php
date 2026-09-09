<?php

namespace App\Tests\Unit;

use App\Repository\UserRepository;
use App\Service\JwtService;
use Firebase\JWT\JWT;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

class JwtServiceTest extends TestCase
{
    private const SECRET = 'test_secret_that_is_longer_than_32_characters';

    public function testExpiredTokenDoesNotAuthenticateAUser(): void
    {
        $repository = $this->createMock(UserRepository::class);
        $service = new JwtService($repository, self::SECRET, 3600);
        $token = JWT::encode([
            'sub' => 1,
            'iat' => time() - 7200,
            'exp' => time() - 3600,
        ], self::SECRET, 'HS256');
        $request = Request::create('/api/me');
        $request->cookies->set(JwtService::COOKIE_NAME, $token);
        $repository->expects(self::never())->method('find');

        self::assertNull($service->getUserFromRequest($request));
    }

    public function testShortSecretIsRejected(): void
    {
        $repository = $this->createStub(UserRepository::class);

        $this->expectException(\RuntimeException::class);
        new JwtService($repository, 'change_this_secret', 3600);
    }

    public function testNonPositiveTtlIsRejected(): void
    {
        $repository = $this->createStub(UserRepository::class);

        $this->expectException(\RuntimeException::class);
        new JwtService($repository, self::SECRET, 0);
    }

    public function testMalformedBearerHeaderIsIgnored(): void
    {
        $repository = $this->createStub(UserRepository::class);
        $service = new JwtService($repository, self::SECRET, 3600);
        $request = Request::create('/api/me');
        $request->headers->set('Authorization', 'Bearer token with spaces');

        self::assertNull($service->getTokenFromRequest($request));
    }
}
