<?php

namespace App\Modules\Logs\Domain\Services;

use Illuminate\Http\Request;

final class LogIngestService
{
    public function __construct(
        private readonly TrackingIdGenerator $trackingIdGenerator,
        private readonly QueuedLogPayloadBuilder $queuedLogPayloadBuilder,
        private readonly LogIngestJobDispatcher $logIngestJobDispatcher,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{message:string,tracking_id:string}
     */
    public function ingest(array $validated, Request $request): array
    {
        $trackingId = $this->trackingIdGenerator->generateTrackingId();
        $payload = $this->queuedLogPayloadBuilder->buildPayloadForQueue($validated, $trackingId, $request);

        $this->logIngestJobDispatcher->dispatchLogIngest($payload);

        return [
            'message' => 'Log recebido para processamento',
            'tracking_id' => $trackingId,
        ];
    }
}
