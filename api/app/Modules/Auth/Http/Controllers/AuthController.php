<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Domain\Services\AuthService;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Resources\AuthResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class AuthController
{
    public function __construct(
        private readonly AuthService $authService,
    ) {
    }

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
}

