<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AuthEndpointTest extends WebTestCase
{
    public function testLoginWithMissingFieldsReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'nobody@woofie.com'])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

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

    public function testLoginIsNotBlockedByAStaleJwtCookie(): void
    {
        $client = static::createClient();
        $client->getCookieJar()->set(new \Symfony\Component\BrowserKit\Cookie('woofie_token', 'expired-token'));

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'stale_' . uniqid() . '@woofie.com',
                'password' => 'WrongPassword123!',
            ])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testRegisterWithEmptyBodyReturns400(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    public function testRegisterWithInvalidTypeReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/register',
            [
                'email'    => 'test_' . uniqid() . '@woofie.com',
                'password' => 'ValidPass123',
                'type'     => 'admin',
            ]
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    public function testRegisterWithShortPasswordReturns400(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/register',
            [
                'email'    => 'test_' . uniqid() . '@woofie.com',
                'password' => '123',
                'type'     => 'owner',
            ]
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testProtectedRouteWithoutTokenReturns401(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/me');

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testRequestWithFakeJwtTokenIsRejected(): void
    {
        $client = static::createClient();

        $fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhhY2tlckB3b29maWUuY29tIn0.fake_signature';

        $client->request(
            'GET',
            '/api/me',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $fakeToken]
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
