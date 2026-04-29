<?php

namespace App\Modules\Logs\Http\Controllers;

use App\Modules\Logs\Domain\Services\LogIngestService;
use App\Modules\Logs\Http\Requests\StoreLogRequest;
use App\Modules\Logs\Http\Resources\LogIngestResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class LogController
{
    public function __construct(
        private readonly LogIngestService $logIngestService,
    ) {}

    public function store(StoreLogRequest $request): JsonResponse
    {
        $result = $this->logIngestService->ingest(
            validated: $request->validated(),
            request: $request,
        );

        $resource = (new LogIngestResource($result))->toArray($request);

        return response()->json($resource, Response::HTTP_ACCEPTED);
    }
}
