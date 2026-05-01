<?php

namespace Tests\Feature\Auth;

use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    public function test_register_creates_user_and_returns_201(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes de register.');
        }

        $response = $this->postJson('/api/register', [
            'name' => 'John Doen',
            'email' => 'johndoe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure([
            'data' => ['id', 'name', 'email'],
        ]);
        $response->assertJsonPath('data.name', 'John Doen');
        $response->assertJsonPath('data.email', 'johndoe@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'johndoe@example.com',
            'name' => 'John Doen',
        ]);
    }

    public function test_register_returns_422_when_payload_is_invalid(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        $response->assertJsonValidationErrors(['name', 'email', 'password']);
    }
}
