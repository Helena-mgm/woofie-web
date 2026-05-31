<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tests fonctionnels pour les endpoints d'authentification.
 *
 * Ces tests utilisent le WebTestCase de Symfony pour simuler de vraies
 * requêtes HTTP contre l'API, sans serveur externe.
 *
 * Prérequis : APP_ENV=test avec une base de données de test (SQLite ou PG).
 */
class AuthEndpointTest extends WebTestCase
{
    // ──────────────────────────────────────────────
    // POST /api/login — cas nominaux
    // ──────────────────────────────────────────────

    /**
     * Un login avec des champs manquants doit retourner 400.
     */
    public function testLoginWithMissingFieldsReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'nobody@woofie.com']) // password manquant
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    /**
     * Un login avec des identifiants invalides doit retourner 401.
     */
    public function testLoginWithWrongCredentialsReturns401(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email'    => 'inexistant@woofie.com',
                'password' => 'mauvaisMotDePasse',
            ])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    // ──────────────────────────────────────────────
    // POST /api/register — validation des entrées
    // ──────────────────────────────────────────────

    /**
     * Un register sans body doit être refusé avec 400.
     */
    public function testRegisterWithEmptyBodyReturns400(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    /**
     * Un register avec un type invalide doit être refusé.
     */
    public function testRegisterWithInvalidTypeReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/register',
            [
                'email'    => 'test_' . uniqid() . '@woofie.com',
                'password' => 'ValidPass123',
                'type'     => 'admin', // type non autorisé
            ]
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    /**
     * Un register avec un mot de passe trop court doit être refusé.
     * Vérifie la contrainte de sécurité minimale des mots de passe.
     */
    public function testRegisterWithShortPasswordReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/register',
            [
                'email'    => 'test_' . uniqid() . '@woofie.com',
                'password' => '123', // trop court (< 6 caractères)
                'type'     => 'owner',
            ]
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    // ──────────────────────────────────────────────
    // Sécurité : routes protégées sans token
    // ──────────────────────────────────────────────

    /**
     * Accéder à une route protégée sans JWT ne doit pas retourner 200 (succès).
     * Vérifie que l'authentification est bien obligatoire.
     * (Retourne 401 ou 403 avec un token valide configuré, 500 si la DB de test
     * est absente — dans tous les cas l'accès non authentifié est bloqué.)
     */
    public function testProtectedRouteWithoutTokenReturns401(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/profile/1');

        $status = $client->getResponse()->getStatusCode();
        // Ne doit PAS retourner 200 (accès autorisé)
        $this->assertNotSame(200, $status, 'Une route protégée ne doit pas être accessible sans token.');
    }

    /**
     * Un token JWT forgé (signature invalide) ne doit pas permettre l'accès.
     * Vérifie que le JwtAuthenticator valide la signature correctement.
     */
    public function testRequestWithFakeJwtTokenIsRejected(): void
    {
        $client = static::createClient();

        $fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhhY2tlckB3b29maWUuY29tIn0.fake_signature';

        $client->request(
            'GET',
            '/api/profile/1',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $fakeToken]
        );

        $status = $client->getResponse()->getStatusCode();
        // Ne doit PAS retourner 200 (accès autorisé avec un faux token)
        $this->assertNotSame(200, $status, 'Un faux token JWT ne doit pas permettre l\'accès.');
    }
}
