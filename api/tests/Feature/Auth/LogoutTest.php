<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    public function test_logout_revokes_current_token(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes com Sanctum.');
        }

        $user = User::query()->create([
            'name' => 'John Logout',
            'email' => 'logout@example.com',
            'password' => 'password',
        ]);
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->postJson('/api/logout', [], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJson([
            'message' => 'Sessão encerrada.',
            'data' => ['ok' => true],
        ]);

        $this->postJson('/api/me', [], [
            'Authorization' => 'Bearer '.$token,
        ])->assertStatus(Response::HTTP_UNAUTHORIZED);
    }

    public function test_logout_requires_authentication(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes com Sanctum.');
        }

        $response = $this->postJson('/api/logout');

        $response->assertStatus(Response::HTTP_UNAUTHORIZED);
    }
}
