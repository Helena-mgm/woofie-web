<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\Response;

class CorsSubscriber implements EventSubscriberInterface
{
    /** @var list<string> */
    private array $allowedOrigins;

    public function __construct(string $corsAllowOrigin)
    {
        $origins = array_values(array_filter(
            array_map('trim', explode(',', $corsAllowOrigin)),
            static fn(string $origin): bool => $origin !== ''
        ));

        foreach ($origins as $origin) {
            $parts = parse_url($origin);
            if ($origin === '*' || !is_array($parts) || !in_array($parts['scheme'] ?? null, ['http', 'https'], true)
                || empty($parts['host']) || !in_array($parts['path'] ?? '', ['', '/'], true)
                || isset($parts['query'], $parts['fragment'], $parts['user'], $parts['pass'])) {
                throw new \RuntimeException('CORS_ALLOW_ORIGIN contains an invalid origin.');
            }
        }

        $this->allowedOrigins = $origins;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 9999],
            KernelEvents::RESPONSE => ['onKernelResponse', 9999],
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
        
        if ($request->getMethod() === 'OPTIONS') {
            $response = new Response();
            $this->applyCorsHeaders($request->headers->get('Origin'), $response);
            $response->headers->set('Access-Control-Max-Age', '3600');
            $event->setResponse($response);
        }
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $response = $event->getResponse();
        $this->applyCorsHeaders($event->getRequest()->headers->get('Origin'), $response);
    }

    private function applyCorsHeaders(?string $origin, Response $response): void
    {
        if ($origin && in_array($origin, $this->allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Vary', 'Origin');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    }
}
