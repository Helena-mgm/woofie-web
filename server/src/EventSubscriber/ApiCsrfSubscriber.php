<?php

namespace App\EventSubscriber;

use App\Service\JwtService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiCsrfSubscriber implements EventSubscriberInterface
{
    private const CSRF_COOKIE = 'woofie_csrf';

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        if (in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        if (in_array($request->getPathInfo(), ['/api/login', '/api/register', '/api/logout'], true)) {
            return;
        }

        $authHeader = $request->headers->get('Authorization');
        if ($authHeader !== null && preg_match('/^Bearer\s+\S+$/', $authHeader) === 1) {
            return;
        }

        if (!$request->cookies->has(JwtService::COOKIE_NAME)) {
            return;
        }

        $cookieToken = (string) $request->cookies->get(self::CSRF_COOKIE, '');
        $headerToken = (string) $request->headers->get('X-CSRF-Token', '');

        if ($cookieToken === '' || $headerToken === '' || !hash_equals($cookieToken, $headerToken)) {
            $event->setResponse(new JsonResponse(['error' => 'CSRF token invalide'], 403));
        }
    }
}
