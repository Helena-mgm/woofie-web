<?php

namespace App\Service;

use Psr\Cache\CacheItemPoolInterface;

class LoginRateLimiter
{
    private const WINDOW_SECONDS = 900;
    private const LOGIN_LIMIT = 5;
    private const REGISTER_LIMIT = 3;
    private const BOT_LIMIT = 20;
    private const SIRET_LIMIT = 30;
    private const POI_LIMIT = 30;

    public function __construct(private CacheItemPoolInterface $cache)
    {
    }

    public function assertLoginAllowed(string $clientKey): ?int
    {
        return $this->hit('login_' . $clientKey, self::LOGIN_LIMIT);
    }

    public function resetLogin(string $clientKey): void
    {
        $this->cache->deleteItem($this->cacheKey('login_' . $clientKey));
    }

    public function assertRegisterAllowed(string $clientKey): ?int
    {
        return $this->hit('register_' . $clientKey, self::REGISTER_LIMIT);
    }

    public function assertBotAllowed(string $clientKey): ?int
    {
        return $this->hit('bot_' . $clientKey, self::BOT_LIMIT);
    }

    public function assertSiretAllowed(string $clientKey): ?int
    {
        return $this->hit('siret_' . $clientKey, self::SIRET_LIMIT);
    }

    public function assertPoiAllowed(string $clientKey): ?int
    {
        return $this->hit('poi_' . $clientKey, self::POI_LIMIT);
    }

    private function hit(string $key, int $limit): ?int
    {
        $cacheKey = $this->cacheKey($key);
        $item = $this->cache->getItem($cacheKey);
        $state = $item->isHit() && is_array($item->get())
            ? $item->get()
            : ['count' => 0, 'reset_at' => time() + self::WINDOW_SECONDS];

        if (($state['count'] ?? 0) >= $limit) {
            return max(1, (int) ($state['reset_at'] ?? time()) - time());
        }

        $state['count'] = (int) ($state['count'] ?? 0) + 1;
        $state['reset_at'] = (int) ($state['reset_at'] ?? (time() + self::WINDOW_SECONDS));

        $item->expiresAfter(max(1, $state['reset_at'] - time()));
        $item->set($state);
        $this->cache->save($item);

        return null;
    }

    private function cacheKey(string $key): string
    {
        return 'rate_limit_' . hash('sha256', $key);
    }
}
