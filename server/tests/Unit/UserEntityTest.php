<?php

namespace App\Tests\Unit;

use App\Entity\User;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasher;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactory;

/**
 * Tests unitaires pour l'entité User.
 *
 * Vérifie la logique de l'entité : rôles, type, hachage de mot de passe.
 */
class UserEntityTest extends TestCase
{
    // ──────────────────────────────────────────────
    // Rôles
    // ──────────────────────────────────────────────

    public function testGetRolesAlwaysContainsRoleUser(): void
    {
        $user = new User();
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testGetRolesReturnsUniqueValues(): void
    {
        $user = new User();
        $user->setRoles(['ROLE_USER', 'ROLE_ADMIN', 'ROLE_USER']);
        $roles = $user->getRoles();
        $this->assertCount(count(array_unique($roles)), $roles);
    }

    // ──────────────────────────────────────────────
    // Email
    // ──────────────────────────────────────────────

    public function testSetAndGetEmail(): void
    {
        $user = new User();
        $user->setEmail('test@woofie.com');
        $this->assertSame('test@woofie.com', $user->getEmail());
    }

    public function testGetUserIdentifierReturnsEmail(): void
    {
        $user = new User();
        $user->setEmail('identifiant@woofie.com');
        $this->assertSame('identifiant@woofie.com', $user->getUserIdentifier());
    }

    // ──────────────────────────────────────────────
    // Type de compte
    // ──────────────────────────────────────────────

    public function testSetTypeOwner(): void
    {
        $user = new User();
        $user->setType('owner');
        $this->assertSame('owner', $user->getType());
    }

    public function testSetTypeSitter(): void
    {
        $user = new User();
        $user->setType('sitter');
        $this->assertSame('sitter', $user->getType());
    }

    // ──────────────────────────────────────────────
    // Sécurité : hachage du mot de passe (Bcrypt)
    // ──────────────────────────────────────────────

    /**
     * Vérifie que le mot de passe stocké est bien haché (Bcrypt via Symfony),
     * et JAMAIS en clair — protection contre une fuite de données.
     */
    public function testPasswordIsHashedAndNotStoredInClearText(): void
    {
        $user = new User();
        $user->setEmail('secure@woofie.com');
        $user->setType('owner');

        $factory = new PasswordHasherFactory([
            User::class => ['algorithm' => 'bcrypt', 'cost' => 4], // cost 4 = rapide en CI
        ]);
        $hasher = new UserPasswordHasher($factory);

        $plainPassword = 'MonMotDePasse123!';
        $hashed = $hasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashed);

        // Le mot de passe stocké ne doit jamais être le mot de passe en clair
        $this->assertNotSame($plainPassword, $user->getPassword());

        // Le hash doit être vérifiable
        $this->assertTrue($hasher->isPasswordValid($user, $plainPassword));

        // Un mauvais mot de passe doit être rejeté
        $this->assertFalse($hasher->isPasswordValid($user, 'mauvaisMotDePasse'));
    }

    // ──────────────────────────────────────────────
    // eraseCredentials ne doit pas lever d'exception
    // ──────────────────────────────────────────────

    public function testEraseCredentialsDoesNotThrow(): void
    {
        $user = new User();
        $user->eraseCredentials(); // Doit être silencieux
        $this->assertTrue(true);  // Si on arrive ici, pas d'exception
    }
}
