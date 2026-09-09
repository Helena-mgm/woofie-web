<?php

namespace App\Tests\Unit;

use App\EventSubscriber\ApiCsrfSubscriber;
use App\EventSubscriber\CorsSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class SecuritySubscriberTest extends TestCase
{
    public function testCorsRejectsWildcardConfiguration(): void
    {
        $this->expectException(\RuntimeException::class);
        new CorsSubscriber('*');
    }

    public function testCorsDoesNotAllowUnknownOrigin(): void
    {
        $subscriber = new CorsSubscriber('https://woofie.ovh,https://www.woofie.ovh');
        $request = Request::create('/api/login', 'POST');
        $request->headers->set('Origin', 'https://evil.example');
        $response = new Response();

        $subscriber->onKernelResponse(new ResponseEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST, $response));

        self::assertFalse($response->headers->has('Access-Control-Allow-Origin'));
    }

    public function testCorsReflectsAllowedOriginWithoutWildcard(): void
    {
        $subscriber = new CorsSubscriber('https://woofie.ovh,https://www.woofie.ovh');
        $request = Request::create('/api/login', 'POST');
        $request->headers->set('Origin', 'https://woofie.ovh');
        $response = new Response();

        $subscriber->onKernelResponse(new ResponseEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST, $response));

        self::assertSame('https://woofie.ovh', $response->headers->get('Access-Control-Allow-Origin'));
        self::assertNotSame('*', $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function testCsrfRejectsCookieAuthenticatedMutationWithoutHeader(): void
    {
        $subscriber = new ApiCsrfSubscriber();
        $request = Request::create('/api/account', 'DELETE');
        $request->cookies->set('woofie_token', 'jwt');
        $request->cookies->set('woofie_csrf', 'csrf-token');
        $event = new RequestEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST);

        $subscriber->onKernelRequest($event);

        self::assertTrue($event->hasResponse());
        self::assertSame(403, $event->getResponse()?->getStatusCode());
    }

    public function testCsrfAcceptsCookieAuthenticatedMutationWithMatchingHeader(): void
    {
        $subscriber = new ApiCsrfSubscriber();
        $request = Request::create('/api/account', 'DELETE');
        $request->cookies->set('woofie_token', 'jwt');
        $request->cookies->set('woofie_csrf', 'csrf-token');
        $request->headers->set('X-CSRF-Token', 'csrf-token');
        $event = new RequestEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST);

        $subscriber->onKernelRequest($event);

        self::assertFalse($event->hasResponse());
    }

    public function testCsrfCannotBeBypassedWithMalformedBearerHeader(): void
    {
        $subscriber = new ApiCsrfSubscriber();
        $request = Request::create('/api/account', 'DELETE');
        $request->cookies->set('woofie_token', 'jwt');
        $request->cookies->set('woofie_csrf', 'csrf-token');
        $request->headers->set('Authorization', 'Bearer ');
        $event = new RequestEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST);

        $subscriber->onKernelRequest($event);

        self::assertTrue($event->hasResponse());
        self::assertSame(403, $event->getResponse()?->getStatusCode());
    }

    public function testCsrfDoesNotBlockLoginWithAStaleAuthenticationCookie(): void
    {
        $subscriber = new ApiCsrfSubscriber();
        $request = Request::create('/api/login', 'POST');
        $request->cookies->set('woofie_token', 'expired-jwt');
        $event = new RequestEvent($this->kernel(), $request, HttpKernelInterface::MAIN_REQUEST);

        $subscriber->onKernelRequest($event);

        self::assertFalse($event->hasResponse());
    }

    private function kernel(): HttpKernelInterface
    {
        return new class implements HttpKernelInterface {
            public function handle(Request $request, int $type = self::MAIN_REQUEST, bool $catch = true): Response
            {
                return new Response();
            }
        };
    }
}
