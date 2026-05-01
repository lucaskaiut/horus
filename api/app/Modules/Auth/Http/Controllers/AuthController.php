<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Models\User;
use App\Modules\Auth\Domain\Services\AuthService;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Resources\AuthResource;
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
            (string) $data['channel'],
            (array) $data['payload'],
        );

        $resource = (new AuthResource($result))->toArray($request);

        return response()->json(['data' => $resource], Response::HTTP_CREATED);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Usuário logado.',
            'data' => [
                'name' => (string) data_get($request->user(), 'name', ''),
                'email' => (string) data_get($request->user(), 'email', ''),
            ],
        ], Response::HTTP_OK);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authService->logout($user);

        return response()->json([
            'message' => 'Sessão encerrada.',
            'data' => ['ok' => true],
        ], Response::HTTP_OK);
    }
}
