<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

final class UserCrudTest extends TestCase
{
    private function skipIfNoDb(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes com Sanctum.');
        }
    }

    /** @return array<string, string> */
    private function bearer(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_index_returns_200_with_paginated_users(): void
    {
        $this->skipIfNoDb();

        $before = User::query()->count();
        $actor = User::factory()->create();
        User::factory()->count(2)->create();

        $response = $this->getJson('/api/users?page=1&per_page=10', $this->bearer($actor));

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'created_at', 'updated_at'],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
        $response->assertJsonPath('meta.total', $before + 3);
    }

    public function test_index_returns_401_without_token(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_index_returns_422_when_page_is_invalid(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();

        $this->getJson('/api/users?page=0', $this->bearer($actor))->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_store_returns_201_and_creates_user(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();

        $response = $this->postJson(
            '/api/users',
            [
                'name' => 'Novo Usuário',
                'email' => 'novo@example.com',
                'password' => 'senha-segura-8',
                'password_confirmation' => 'senha-segura-8',
            ],
            $this->bearer($actor),
        );

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Novo Usuário');
        $response->assertJsonPath('data.email', 'novo@example.com');
        $this->assertDatabaseHas('users', ['email' => 'novo@example.com']);
    }

    public function test_store_returns_401_without_token(): void
    {
        $this->postJson('/api/users', [
            'name' => 'X',
            'email' => 'x@example.com',
            'password' => 'password-8-chars',
            'password_confirmation' => 'password-8-chars',
        ])->assertUnauthorized();
    }

    public function test_store_returns_422_when_payload_is_invalid(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();

        $this->postJson(
            '/api/users',
            [
                'name' => '',
                'email' => 'not-an-email',
                'password' => 'short',
                'password_confirmation' => 'other',
            ],
            $this->bearer($actor),
        )->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_show_returns_200(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create(['email' => 'alvo@example.com']);

        $response = $this->getJson('/api/users/'.$target->id, $this->bearer($actor));

        $response->assertOk();
        $response->assertJsonPath('data.id', $target->id);
        $response->assertJsonPath('data.email', 'alvo@example.com');
    }

    public function test_show_returns_401_without_token(): void
    {
        $this->getJson('/api/users/1')->assertUnauthorized();
    }

    public function test_show_returns_422_when_format_query_is_invalid(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->getJson('/api/users/'.$target->id.'?format=html', $this->bearer($actor))->assertStatus(
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }

    public function test_update_put_returns_200(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create(['name' => 'Antigo', 'email' => 'antigo@example.com']);

        $response = $this->putJson(
            '/api/users/'.$target->id,
            [
                'name' => 'Atualizado PUT',
                'email' => 'put@example.com',
            ],
            $this->bearer($actor),
        );

        $response->assertOk();
        $response->assertJsonPath('data.name', 'Atualizado PUT');
        $response->assertJsonPath('data.email', 'put@example.com');
        $this->assertDatabaseHas('users', ['id' => $target->id, 'email' => 'put@example.com']);
    }

    public function test_update_put_returns_401_without_token(): void
    {
        $this->putJson('/api/users/1', [
            'name' => 'X',
            'email' => 'x@example.com',
        ])->assertUnauthorized();
    }

    public function test_update_put_returns_422_when_email_already_used(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create(['email' => 'b@example.com']);
        User::factory()->create(['email' => 'taken@example.com']);

        $this->putJson(
            '/api/users/'.$target->id,
            [
                'name' => 'Nome',
                'email' => 'taken@example.com',
            ],
            $this->bearer($actor),
        )->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_update_patch_returns_200_for_partial_update(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create(['name' => 'Só Nome Muda']);

        $response = $this->patchJson(
            '/api/users/'.$target->id,
            ['name' => 'Nome PATCH'],
            $this->bearer($actor),
        );

        $response->assertOk();
        $response->assertJsonPath('data.name', 'Nome PATCH');
    }

    public function test_update_patch_returns_401_without_token(): void
    {
        $this->patchJson('/api/users/1', ['name' => 'X'])->assertUnauthorized();
    }

    public function test_update_patch_returns_422_when_password_confirmation_mismatches(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->patchJson(
            '/api/users/'.$target->id,
            [
                'password' => 'nova-senha-8',
                'password_confirmation' => 'outra-senha-9',
            ],
            $this->bearer($actor),
        )->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_destroy_returns_200_and_removes_user(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->deleteJson('/api/users/'.$target->id, [], $this->bearer($actor));

        $response->assertOk();
        $response->assertJsonPath('data.ok', true);
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_destroy_returns_401_without_token(): void
    {
        $this->deleteJson('/api/users/1')->assertUnauthorized();
    }

    public function test_destroy_returns_422_when_dry_run_query_is_invalid(): void
    {
        $this->skipIfNoDb();

        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->deleteJson('/api/users/'.$target->id.'?dry_run=maybe', [], $this->bearer($actor))->assertStatus(
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
