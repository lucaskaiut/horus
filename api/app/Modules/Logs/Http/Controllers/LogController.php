<?php

namespace App\Modules\Logs\Http\Controllers;

use App\Modules\Logs\Domain\Services\LogIngestService;
use App\Modules\Logs\Domain\Services\LogSearchService;
use App\Modules\Logs\Domain\Services\LogStatsService;
use App\Modules\Logs\Http\Requests\DashboardLogsRequest;
use App\Modules\Logs\Http\Requests\ListLogsRequest;
use App\Modules\Logs\Http\Requests\StoreLogRequest;
use App\Modules\Logs\Http\Resources\LogIngestResource;
use App\Modules\Logs\Http\Resources\LogResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class LogController
{
    public function __construct(
        private readonly LogIngestService $logIngestService,
        private readonly LogSearchService $logSearchService,
        private readonly LogStatsService $logStatsService,
    ) {}

    public function index(ListLogsRequest $request): JsonResponse
    {
        $result = $this->logSearchService->search($request->validated());
        /** @var array<int, array<string, mixed>> $items */
        $items = $result['items'];

        $collection = LogResource::collection($items);

        return response()->json([
            'data' => $collection->toArray($request),
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => $result['per_page'],
            ],
        ], Response::HTTP_OK);
    }

    public function summary(DashboardLogsRequest $request): JsonResponse
    {
        $payload = $this->logStatsService->summarize($request->validated());

        return response()->json([
            'data' => $payload,
        ], Response::HTTP_OK);
    }

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
