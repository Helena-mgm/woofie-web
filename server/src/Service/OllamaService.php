<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class OllamaService
{
    private string $ollamaUrl;

    public function __construct(
        private HttpClientInterface $httpClient,
        string $ollamaApiUrl,
        private string $ollamaModel,
        private int $ollamaTimeoutSeconds,
        private int $ollamaMaxResponseChars
    ) {
        $this->ollamaUrl = rtrim($ollamaApiUrl, '/');

        if ($this->ollamaUrl === '' || $this->ollamaModel === '' || $this->ollamaTimeoutSeconds < 1 || $this->ollamaMaxResponseChars < 1) {
            throw new \RuntimeException('Ollama configuration is invalid.');
        }
    }

    public function chat(string $userMessage, array $history = []): string
    {
        $messages = array_merge(
            [[
                'role' => 'system',
                'content' => 'Tu es WoofieBot, un assistant canin expert et amical. Tu aides les propriétaires de chiens avec des conseils sur l\'éducation, la santé, le comportement et le bien-être de leurs compagnons. Réponds toujours en français de manière chaleureuse et empathique, comme un ami qui aime les chiens. Utilise des emojis 🐕 occasionnellement.'
            ]],
            $history,
            [['role' => 'user', 'content' => $userMessage]]
        );

        try {
            $response = $this->httpClient->request('POST', $this->ollamaUrl . '/api/chat', [
                'json' => [
                    'model' => $this->ollamaModel,
                    'messages' => $messages,
                    'stream' => false,
                    'options' => [
                        'temperature' => 0.7,
                        'top_p' => 0.9,
                        'num_ctx' => 4096,
                    ],
                ],
                'timeout' => $this->ollamaTimeoutSeconds,
            ]);

            $data = $response->toArray(false);
            $fullResponse = is_string($data['message']['content'] ?? null)
                ? trim($data['message']['content'])
                : '';

            if ($fullResponse === '') {
                return 'Woof! Désolé, je n\'ai pas compris 🐕';
            }

            return mb_substr($fullResponse, 0, $this->ollamaMaxResponseChars);
        } catch (\Throwable $exception) {
            error_log('[OllamaService] ' . $exception::class);
            return 'Woof! Je suis temporairement indisponible. Réessaie dans un instant 🐾';
        }
    }

    public function isAvailable(): bool
    {
        try {
            $response = $this->httpClient->request('GET', $this->ollamaUrl . '/api/tags', [
                'timeout' => 5,
            ]);
            return $response->getStatusCode() === 200;
        } catch (\Throwable) {
            return false;
        }
    }
}
