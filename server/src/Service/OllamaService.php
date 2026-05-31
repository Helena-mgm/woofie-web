<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class OllamaService
{
    private string $ollamaUrl;

    public function __construct(
        private HttpClientInterface $httpClient,
        string $ollamaApiUrl = 'http://ollama:11434'
    ) {
        $this->ollamaUrl = getenv('OLLAMA_API_URL') ?: $ollamaApiUrl;
    }

    public function chat(string $userMessage, array $history = []): string
    {
        $messages = array_merge($history, [
            [
                'role' => 'system',
                'content' => 'Tu es WoofieBot, un assistant canin expert et amical. Tu aides les propriétaires de chiens avec des conseils sur l\'éducation, la santé, le comportement et le bien-être de leurs compagnons. Réponds toujours en français de manière chaleureuse et empathique, comme un ami qui aime les chiens. Utilise des emojis 🐕 occasionnellement.'
            ],
            ['role' => 'user', 'content' => $userMessage]
        ]);

        try {
            $response = $this->httpClient->request('POST', $this->ollamaUrl . '/api/chat', [
                'json' => [
                    'model' => 'llama3.2',
                    'messages' => $messages,
                    'stream' => true, // Activer le streaming pour réponses en temps réel
                    'options' => [
                        'temperature' => 0.7,
                        'top_p' => 0.9,
                        'num_ctx' => 4096, // Contexte augmenté pour messages longs
                    ],
                ],
                'timeout' => 120, // Timeout augmenté pour messages longs
            ]);

            $fullResponse = '';
            foreach ($this->httpClient->stream($response) as $chunk) {
                $content = $chunk->getContent();
                $lines = explode("\n", $content);
                
                foreach ($lines as $line) {
                    if (empty($line)) continue;
                    
                    $data = json_decode($line, true);
                    if (isset($data['message']['content'])) {
                        $fullResponse .= $data['message']['content'];
                    }
                }
            }

            return !empty($fullResponse) ? $fullResponse : 'Woof! Désolé, je n\'ai pas compris 🐕';
        } catch (\Exception $e) {
            error_log('[OllamaService] Error: ' . $e->getMessage());
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
        } catch (\Exception $e) {
            return false;
        }
    }
}
