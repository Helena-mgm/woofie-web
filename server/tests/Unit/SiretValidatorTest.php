<?php

namespace App\Tests\Unit;

use App\Service\SiretValidator;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Tests unitaires pour le service SiretValidator.
 *
 * Ces tests vérifient la logique métier locale (format + algorithme de Luhn)
 * sans appel réseau, ce qui les rend rapides et déterministes en CI.
 */
class SiretValidatorTest extends TestCase
{
    private SiretValidator $validator;

    protected function setUp(): void
    {
        // On injecte un mock du client HTTP : aucun appel réseau ne sera effectué
        $httpClient = $this->createMock(HttpClientInterface::class);
        $this->validator = new SiretValidator($httpClient, null);
    }

    // ──────────────────────────────────────────────
    // Tests de validation du FORMAT (14 chiffres)
    // ──────────────────────────────────────────────

    public function testValidFormatAccepts14Digits(): void
    {
        $this->assertTrue($this->validator->isValidFormat('73282932000074'));
    }

    public function testInvalidFormatRejectsTooShort(): void
    {
        $this->assertFalse($this->validator->isValidFormat('1234567890123')); // 13 chiffres
    }

    public function testInvalidFormatRejectsTooLong(): void
    {
        $this->assertFalse($this->validator->isValidFormat('123456789012345')); // 15 chiffres
    }

    public function testInvalidFormatRejectsLetters(): void
    {
        $this->assertFalse($this->validator->isValidFormat('7328293200007A'));
    }

    public function testInvalidFormatRejectsEmpty(): void
    {
        $this->assertFalse($this->validator->isValidFormat(''));
    }

    // ──────────────────────────────────────────────
    // Tests de l'algorithme de LUHN
    // ──────────────────────────────────────────────

    /**
     * SIRET réel de la MAIRIE DE PARIS — clé Luhn valide.
     */
    public function testLuhnAcceptsValidSiret(): void
    {
        $this->assertTrue($this->validator->validateLuhn('21750001600019'));
    }

    /**
     * Un chiffre modifié rend la clé invalide.
     */
    public function testLuhnRejectsInvalidCheckDigit(): void
    {
        // On change le dernier chiffre : 19 → 18
        $this->assertFalse($this->validator->validateLuhn('21750001600018'));
    }

    /**
     * Un SIRET au mauvais format ne passe pas le Luhn non plus.
     */
    public function testLuhnRejectsWrongFormat(): void
    {
        $this->assertFalse($this->validator->validateLuhn('not-a-siret'));
    }

    // ──────────────────────────────────────────────
    // Test de sécurité : pas d'injection possible
    // ──────────────────────────────────────────────

    /**
     * Vérifie que des caractères spéciaux ne contournent pas la validation.
     * Protection contre toute tentative d'injection dans un futur appel API.
     */
    public function testFormatRejectsSpecialCharacters(): void
    {
        $this->assertFalse($this->validator->isValidFormat("'; DROP TABLE users;--"));
        $this->assertFalse($this->validator->isValidFormat('<script>alert(1)</script>'));
    }
}
