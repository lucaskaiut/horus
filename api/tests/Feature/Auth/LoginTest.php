<?php

namespace Tests\Feature\Auth;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LoginTest extends TestCase
{
    public function test_login_proxies_to_auth_server_and_returns_token_name_email(): void
    {
        config()->set('services.auth_server.base_url', 'https://auth.test');
        config()->set('services.auth_server.timeout', 5);

        Http::fake([
            'https://auth.test/auth' => Http::response([
                'success' => true,
                'message' => 'OK',
                'content' => [
                    'id' => '68016d3egdbe174532',
                    'name' => 'John Doen',
                    'email' => 'johndoe@example.com',
                    'role' => 'SUPERADMIN',
                    'customer' => null,
                    'token' => '1|8fG09Kcxc1gnGqGG064tWT8XtSJLDJi1GHYpjKFG',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/login', [
            'login' => 'johndoe@example.com',
            'password' => 'secret',
            'google2faValidation' => '123456',
        ]);

        $response->assertCreated();
        $response->assertJson([
            'data' => [
                'token' => '1|8fG09Kcxc1gnGqGG064tWT8XtSJLDJi1GHYpjKFG',
                'name' => 'John Doen',
                'email' => 'johndoe@example.com',
            ],
        ]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://auth.test/auth'
                && $request['login'] === 'johndoe@example.com'
                && $request['password'] === 'secret'
                && $request['google2faValidation'] === '123456';
        });
    }
}
