<?php

namespace App\Tests\Unit;

use App\Service\LoginRateLimiter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;

class LoginRateLimiterTest extends TestCase
{
    public function testLoginIsBlockedAfterFiveAttemptsAndCanBeReset(): void
    {
        $limiter = new LoginRateLimiter(new ArrayAdapter());

        for ($attempt = 0; $attempt < 5; $attempt++) {
            self::assertNull($limiter->assertLoginAllowed('user@example.test|127.0.0.1'));
        }

        self::assertGreaterThan(0, $limiter->assertLoginAllowed('user@example.test|127.0.0.1'));

        $limiter->resetLogin('user@example.test|127.0.0.1');

        self::assertNull($limiter->assertLoginAllowed('user@example.test|127.0.0.1'));
    }

    public function testLimitsAreSeparatedByFeature(): void
    {
        $limiter = new LoginRateLimiter(new ArrayAdapter());

        for ($attempt = 0; $attempt < 3; $attempt++) {
            self::assertNull($limiter->assertRegisterAllowed('127.0.0.1'));
        }

        self::assertGreaterThan(0, $limiter->assertRegisterAllowed('127.0.0.1'));
        self::assertNull($limiter->assertSiretAllowed('127.0.0.1'));
        self::assertNull($limiter->assertBotAllowed('127.0.0.1'));
        self::assertNull($limiter->assertPoiAllowed('127.0.0.1'));
    }
}
