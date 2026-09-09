<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

class AuthCookieFactory
{
    private const AUTH_MARKER = 'woofie_auth';
    private const CSRF_COOKIE = 'woofie_csrf';

    public function __construct(
        private bool $authCookieSecure,
        private int $jwtTtlSeconds
    ) {
    }

    public function create(string $jwt, Request $request): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(JwtService::COOKIE_NAME)
            ->withValue($jwt)
            ->withExpires(time() + $this->jwtTtlSeconds)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    public function createAuthMarker(Request $request): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(self::AUTH_MARKER)
            ->withValue('1')
            ->withExpires(time() + $this->jwtTtlSeconds)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(false)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    public function createCsrfCookie(Request $request, ?string $value = null): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(self::CSRF_COOKIE)
            ->withValue($value ?? bin2hex(random_bytes(32)))
            ->withExpires(time() + $this->jwtTtlSeconds)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(false)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    public function clear(Request $request): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(JwtService::COOKIE_NAME)
            ->withValue('')
            ->withExpires(1)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    public function clearAuthMarker(Request $request): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(self::AUTH_MARKER)
            ->withValue('')
            ->withExpires(1)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(false)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    public function clearCsrfCookie(Request $request): Cookie
    {
        $secure = $this->isSecure($request);

        return Cookie::create(self::CSRF_COOKIE)
            ->withValue('')
            ->withExpires(1)
            ->withPath('/')
            ->withSecure($secure)
            ->withHttpOnly(false)
            ->withSameSite(Cookie::SAMESITE_STRICT);
    }

    private function isSecure(Request $request): bool
    {
        return $this->authCookieSecure || $request->isSecure();
    }
}
