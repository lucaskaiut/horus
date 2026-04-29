<?php

namespace App\Http\Middleware;

use App\Modules\Logs\Domain\Services\ExternalBearerTokenValidationService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ValidateAuthServerToken
{
    public function __construct(
        private readonly ExternalBearerTokenValidationService $tokenValidationService,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/login')) {
            return $next($request);
        }

        $validation = $this->tokenValidationService->validateBearerToken((string) $request->bearerToken());

        if (! $validation->isValid()) {
            return new JsonResponse([
                'message' => 'Usuário não autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $request->attributes->set('auth_server_user', [
            'id' => $validation->clientId,
            'name' => $validation->clientName,
            'email' => $validation->clientEmail,
        ]);

        return $next($request);
    }
}
