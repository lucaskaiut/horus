<?php

namespace Tests\Feature\Security;

use Tests\TestCase;

/**
 * Rotas que só exigem middleware de autenticação (sem migrações / BD).
 */
final class UnauthenticatedApiRoutesTest extends TestCase
{
    public function test_protected_routes_return_401_without_token(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
        $this->postJson('/api/users', [])->assertUnauthorized();
        $this->getJson('/api/users/1')->assertUnauthorized();
        $this->patchJson('/api/users/1', [])->assertUnauthorized();
        $this->deleteJson('/api/users/1')->assertUnauthorized();
        $this->getJson('/api/logs')->assertUnauthorized();
        $this->getJson('/api/logs/summary')->assertUnauthorized();
        $this->postJson('/api/logs', [])->assertUnauthorized();
        $this->postJson('/api/me', [])->assertUnauthorized();
        $this->postJson('/api/logout', [])->assertUnauthorized();
    }
}
