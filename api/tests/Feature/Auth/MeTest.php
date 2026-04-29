<?php

namespace Tests\Feature\Auth;

use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class MeTest extends TestCase
{
    public function test_me_returns_ok_when_auth_server_returns_ok(): void
    {
        config()->set('services.auth_server.base_url', 'https://auth.test');
        config()->set('services.auth_server.timeout', 5);

        Http::fake([
            'https://auth.test/auth/me' => Http::response(['ok' => true], 200),
        ]);

        $response = $this->postJson('/api/me', [], [
            'Authorization' => 'Bearer test-token',
        ]);

        $response->assertOk();
        $response->assertJson([
            'message' => 'Usuário logado.',
        ]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://auth.test/auth/me'
                && $request->method() === 'GET'
                && $request->hasHeader('Authorization', 'Bearer test-token');
        });
    }

    public function test_me_returns_unauthorized_when_auth_server_fails(): void
    {
        config()->set('services.auth_server.base_url', 'https://auth.test');
        config()->set('services.auth_server.timeout', 5);

        Http::fake([
            'https://auth.test/auth/me' => Http::response(['message' => 'unauthorized'], 401),
        ]);

        $response = $this->postJson('/api/me', [], [
            'Authorization' => 'Bearer test-token',
        ]);

        $response->assertStatus(Response::HTTP_UNAUTHORIZED);
        $response->assertJson([
            'message' => 'Usuário não autenticado.',
        ]);
    }
}
