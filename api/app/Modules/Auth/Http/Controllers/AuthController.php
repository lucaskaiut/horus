<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Domain\Services\AuthService;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Resources\AuthResource;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthController
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $this->authService->login(
            login: $data['login'],
            password: $data['password'],
            google2faValidation: $data['google2faValidation'] ?? null,
        );

        $resource = (new AuthResource($result))->toArray($request);

        return response()->json(['data' => $resource], Response::HTTP_CREATED);
    }

    public function me(Request $request): JsonResponse
    {
        $bearerToken = (string) $request->bearerToken();

        if ($bearerToken === '') {
            return response()->json(['message' => 'Usuário não autenticado.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $result = $this->authService->me($bearerToken);
        } catch (RequestException) {
            return response()->json(['message' => 'Usuário não autenticado.'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'message' => 'Usuário logado.',
            'data' => [
                'name' => (string) data_get($result, 'content.name', data_get($result, 'name', '')),
                'email' => (string) data_get($result, 'content.email', data_get($result, 'email', '')),
            ],
        ], Response::HTTP_OK);
    }
}
