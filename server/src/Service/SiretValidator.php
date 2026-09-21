<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class SiretValidator
{
    private const API_SIRENE_URL = 'https://api.insee.fr/api-sirene/3.11/siret/';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly ?string $inseeApiKey = null
    ) {
    }

    public function isValidFormat(string $siret): bool
    {
        return preg_match('/^\d{14}$/', $this->normalize($siret)) === 1;
    }

    public function validateLuhn(string $siret): bool
    {
        $siret = $this->normalize($siret);

        if (!$this->isValidFormat($siret)) {
            return false;
        }

        $sum = 0;

        for ($i = 13, $positionFromRight = 0; $i >= 0; $i--, $positionFromRight++) {
            $digit = (int) $siret[$i];

            if ($positionFromRight % 2 === 1) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }

            $sum += $digit;
        }

        return $sum % 10 === 0;
    }

    public function checkSiretExistence(string $siret): array
    {
        $siret = $this->normalize($siret);

        if (!$this->isValidFormat($siret)) {
            return [
                'exists' => false,
                'error' => 'Format SIRET invalide'
            ];
        }

        $apiKey = is_string($this->inseeApiKey) ? trim($this->inseeApiKey) : '';
        if ($apiKey === '') {
            return [
                'exists' => false,
                'error' => 'Clé API INSEE non configurée (validation locale uniquement)'
            ];
        }

        try {
            $response = $this->httpClient->request('GET', self::API_SIRENE_URL . $siret, [
                'headers' => [
                    'X-INSEE-Api-Key-Integration' => $apiKey,
                    'Accept' => 'application/json',
                ],
                'timeout' => 5,
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode === 404) {
                return [
                    'exists' => false,
                    'error' => 'SIRET non trouvé dans la base Sirene'
                ];
            }

            if ($statusCode !== 200) {
                return [
                    'exists' => false,
                    'error' => 'Erreur API Sirene (code ' . $statusCode . ')'
                ];
            }

            $data = $response->toArray();
            $legalEntity = $data['etablissement']['uniteLegale'] ?? [];
            $companyName = is_string($legalEntity['denominationUniteLegale'] ?? null)
                ? trim($legalEntity['denominationUniteLegale'])
                : trim(implode(' ', array_filter([
                    is_string($legalEntity['prenomUsuelUniteLegale'] ?? null) ? $legalEntity['prenomUsuelUniteLegale'] : null,
                    is_string($legalEntity['nomUniteLegale'] ?? null) ? $legalEntity['nomUniteLegale'] : null,
                ])));

            if ($companyName === '') {
                $companyName = 'Entreprise trouvée';
            }

            return [
                'exists' => true,
                'companyName' => $companyName
            ];

        } catch (\Throwable) {
            return [
                'exists' => false,
                'error' => 'Vérification Sirene temporairement indisponible'
            ];
        }
    }

    public function validate(string $siret, bool $checkApi = true): array
    {
        $siret = $this->normalize($siret);

        if (!$this->isValidFormat($siret)) {
            return [
                'isValid' => false,
                'message' => 'SIRET invalide : doit contenir exactement 14 chiffres'
            ];
        }

        if (!$this->validateLuhn($siret)) {
            return [
                'isValid' => false,
                'message' => 'SIRET invalide : clé de contrôle incorrecte'
            ];
        }

        if ($checkApi) {
            $existenceCheck = $this->checkSiretExistence($siret);

            return [
                'isValid' => true,
                'exists' => $existenceCheck['exists'] ?? false,
                'companyName' => $existenceCheck['companyName'] ?? null,
                'message' => $existenceCheck['exists']
                    ? 'SIRET vérifié : ' . ($existenceCheck['companyName'] ?? 'Entreprise trouvée')
                    : 'SIRET valide (format et clé correcte) - ' . ($existenceCheck['error'] ?? 'Vérification API non disponible')
            ];
        }

        return [
            'isValid' => true,
            'message' => 'SIRET valide (format et clé de contrôle corrects)'
        ];
    }

    public function format(string $siret): string
    {
        $cleaned = $this->normalize($siret);

        if (strlen($cleaned) !== 14) {
            return $siret;
        }

        return substr($cleaned, 0, 3) . ' '
            . substr($cleaned, 3, 3) . ' '
            . substr($cleaned, 6, 3) . ' '
            . substr($cleaned, 9, 5);
    }

    private function normalize(string $siret): string
    {
        $siret = trim($siret);
        if ($siret === '' || preg_match('/^[\d\s.-]+$/', $siret) !== 1) {
            return '';
        }

        return preg_replace('/[\s.-]+/', '', $siret) ?? '';
    }
}
