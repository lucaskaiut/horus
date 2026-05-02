<?php

namespace App\Modules\Users\Http\Controllers;

use App\Models\User;
use App\Modules\Users\Domain\Services\UserCrudService;
use App\Modules\Users\Http\Requests\DestroyUserRequest;
use App\Modules\Users\Http\Requests\ListUsersRequest;
use App\Modules\Users\Http\Requests\ShowUserRequest;
use App\Modules\Users\Http\Requests\StoreUserRequest;
use App\Modules\Users\Http\Requests\UpdateUserRequest;
use App\Modules\Users\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class UserController
{
    public function __construct(
        private readonly UserCrudService $userCrudService,
    ) {}

    public function index(ListUsersRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? 15);
        $paginator = $this->userCrudService->paginate($page, $perPage);

        return UserResource::collection($paginator)
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $payload = collect($request->validated())
            ->except('password_confirmation')
            ->all();
        /** @var array{name: string, email: string, password: string} $payload */
        $user = $this->userCrudService->create($payload);

        return response()->json([
            'data' => (new UserResource($user))->resolve(),
        ], Response::HTTP_CREATED);
    }

    public function show(ShowUserRequest $request, User $user): JsonResponse
    {
        return response()->json([
            'data' => (new UserResource($user))->resolve(),
        ], Response::HTTP_OK);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $payload = collect($request->validated())
            ->except('password_confirmation')
            ->all();
        $user = $this->userCrudService->update($user, $payload);

        return response()->json([
            'data' => (new UserResource($user))->resolve(),
        ], Response::HTTP_OK);
    }

    public function destroy(DestroyUserRequest $request, User $user): JsonResponse
    {
        $this->userCrudService->delete($user);

        return response()->json([
            'message' => 'Usuário removido.',
            'data' => ['ok' => true],
        ], Response::HTTP_OK);
    }
}
