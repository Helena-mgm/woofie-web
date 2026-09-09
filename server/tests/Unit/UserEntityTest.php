<?php

namespace App\Tests\Unit;

use App\Entity\User;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasher;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactory;

class UserEntityTest extends TestCase
{
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

    public function testPasswordIsHashedAndNotStoredInClearText(): void
    {
        $user = new User();
        $user->setEmail('secure@woofie.com');
        $user->setType('owner');

        $factory = new PasswordHasherFactory([
            User::class => ['algorithm' => 'bcrypt', 'cost' => 4],
        ]);
        $hasher = new UserPasswordHasher($factory);

        $plainPassword = 'MonMotDePasse123!';
        $hashed = $hasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashed);

        $this->assertNotSame($plainPassword, $user->getPassword());
        $this->assertTrue($hasher->isPasswordValid($user, $plainPassword));
        $this->assertFalse($hasher->isPasswordValid($user, 'mauvaisMotDePasse'));
    }

    public function testEraseCredentialsDoesNotThrow(): void
    {
        $this->expectNotToPerformAssertions();
        $user = new User();
        $user->eraseCredentials();
    }
}
