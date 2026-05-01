<?php

namespace Tests\Feature\Auth;

use App\Modules\Auth\Domain\Contracts\LoginChannel;
use App\Modules\Auth\Domain\Services\LoginChannelRegistry;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LoginTest extends TestCase
{
    public function test_login_with_channel_internal_uses_sanctum_token_and_does_not_proxy(): void
    {
        $registry = new LoginChannelRegistry([
            new class implements LoginChannel
            {
                public function key(): string
                {
                    return 'internal';
                }

                public function payloadRules(): array
                {
                    return [
                        'payload.email' => ['required', 'email'],
                        'payload.password' => ['required', 'string'],
                    ];
                }

                public function login(array $payload): array
                {
                    if (
                        (string) data_get($payload, 'email') !== 'internal@example.com'
                        || (string) data_get($payload, 'password') !== 'password'
                    ) {
                        throw ValidationException::withMessages([
                            'payload.email' => ['Credenciais inválidas.'],
                        ]);
                    }

                    return [
                        'token' => '1|internal',
                        'name' => 'Internal User',
                        'email' => 'internal@example.com',
                    ];
                }
            },
        ]);

        $this->app->instance(LoginChannelRegistry::class, $registry);

        $response = $this->postJson('/api/login', [
            'channel' => 'internal',
            'payload' => [
                'email' => 'internal@example.com',
                'password' => 'password',
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Internal User');
        $response->assertJsonPath('data.email', 'internal@example.com');
        $response->assertJsonStructure(['data' => ['token', 'name', 'email']]);
        $response->assertJsonPath('data.token', '1|internal');
    }
}
