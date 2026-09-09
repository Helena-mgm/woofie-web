<?php

namespace App\Tests\Unit;

use App\Service\SiretValidator;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class SiretValidatorTest extends TestCase
{
    private SiretValidator $validator;

    protected function setUp(): void
    {
        $httpClient = $this->createStub(HttpClientInterface::class);
        $this->validator = new SiretValidator($httpClient, null);
    }

    public function testValidFormatAccepts14Digits(): void
    {
        $this->assertTrue($this->validator->isValidFormat('73282932000074'));
    }

    public function testValidFormatAcceptsSeparatedDigits(): void
    {
        $this->assertTrue($this->validator->isValidFormat('443 061 841 00047'));
        $this->assertTrue($this->validator->isValidFormat('443-061-841-00047'));
    }

    public function testInvalidFormatRejectsTooShort(): void
    {
        $this->assertFalse($this->validator->isValidFormat('1234567890123'));
    }

    public function testInvalidFormatRejectsTooLong(): void
    {
        $this->assertFalse($this->validator->isValidFormat('123456789012345'));
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
     * SIRET réel Google France — clé Luhn valide.
     */
    public function testLuhnAcceptsGoogleFranceSiret(): void
    {
        $this->assertTrue($this->validator->validateLuhn('44306184100047'));
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
        $this->assertFalse($this->validator->isValidFormat('44306184100047<script>'));
    }
}
