<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class SiretValidator
{
    private const API_SIRENE_URL = 'https://api.insee.fr/entreprises/sirene/V3/siret/';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly ?string $inseeApiKey = null
    ) {
    }

    /**
     * Valide le format SIRET (14 chiffres)
     */
    public function isValidFormat(string $siret): bool
    {
        return preg_match('/^\d{14}$/', $siret) === 1;
    }

    /**
     * Algorithme de Luhn pour valider la clé de contrôle du SIRET
     */
    public function validateLuhn(string $siret): bool
    {
        if (!$this->isValidFormat($siret)) {
            return false;
        }

        $sum = 0;

        for ($i = 0; $i < 14; $i++) {
            $digit = (int) $siret[$i];

            // Positions impaires (index pair car on compte de gauche à droite)
            if ($i % 2 === 1) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }

            $sum += $digit;
        }

        return $sum % 10 === 0;
    }

    /**
     * Vérifie si le SIRET existe dans la base Sirene via l'API INSEE
     */
    public function checkSiretExistence(string $siret): array
    {
        if (!$this->isValidFormat($siret)) {
            return [
                'exists' => false,
                'error' => 'Format SIRET invalide'
            ];
        }

        if (!$this->inseeApiKey) {
            return [
                'exists' => false,
                'error' => 'Clé API INSEE non configurée (validation locale uniquement)'
            ];
        }

        try {
            $response = $this->httpClient->request('GET', self::API_SIRENE_URL . $siret, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->inseeApiKey,
                    'Accept' => 'application/json',
                ],
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
            $companyName = $data['etablissement']['uniteLegale']['denominationUniteLegale']
                ?? $data['etablissement']['uniteLegale']['prenomUsuelUniteLegale'] . ' ' . $data['etablissement']['uniteLegale']['nomUniteLegale']
                ?? 'Entreprise trouvée';

            return [
                'exists' => true,
                'companyName' => trim($companyName)
            ];

        } catch (\Exception $e) {
            return [
                'exists' => false,
                'error' => 'Erreur lors de la vérification: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validation complète du SIRET
     */
    public function validate(string $siret, bool $checkApi = true): array
    {
        // 1. Vérifier le format
        if (!$this->isValidFormat($siret)) {
            return [
                'isValid' => false,
                'message' => 'SIRET invalide : doit contenir exactement 14 chiffres'
            ];
        }

        // 2. Vérifier l'algorithme de Luhn
        if (!$this->validateLuhn($siret)) {
            return [
                'isValid' => false,
                'message' => 'SIRET invalide : clé de contrôle incorrecte'
            ];
        }

        // 3. Vérifier via API si demandé
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

        // Validation basique uniquement
        return [
            'isValid' => true,
            'message' => 'SIRET valide (format et clé de contrôle corrects)'
        ];
    }

    /**
     * Formate un SIRET pour l'affichage : XXX XXX XXX XXXXX
     */
    public function format(string $siret): string
    {
        $cleaned = preg_replace('/\s/', '', $siret);

        if (strlen($cleaned) !== 14) {
            return $siret;
        }

        return substr($cleaned, 0, 3) . ' '
            . substr($cleaned, 3, 3) . ' '
            . substr($cleaned, 6, 3) . ' '
            . substr($cleaned, 9, 5);
    }
}
