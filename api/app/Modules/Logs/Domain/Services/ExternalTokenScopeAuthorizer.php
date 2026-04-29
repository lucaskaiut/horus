<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\ValueObjects\TokenValidationResult;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;

final class ExternalTokenScopeAuthorizer
{
    /**
     * @throws AuthenticationException
     * @throws AuthorizationException
     */
    public function ensureHasScope(TokenValidationResult $validation, string $requiredScope): void
    {
        if (! $validation->isValid()) {
            throw new AuthenticationException('Token inválido ou não autorizado.');
        }

        if (! $validation->hasScope($requiredScope)) {
            throw new AuthorizationException('Token sem escopo necessário: '.$requiredScope.'.');
        }
    }
}
