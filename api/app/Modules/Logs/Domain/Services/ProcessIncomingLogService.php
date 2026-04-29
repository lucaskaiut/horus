<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\Contracts\LogDocumentIndexer;
use Carbon\CarbonImmutable;

final class ProcessIncomingLogService
{
    public function __construct(
        private readonly LogDocumentIndexer $logDocumentIndexer,
        private readonly SensitiveLogDataMasker $sensitiveLogDataMasker,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function process(array $payload): void
    {
        $document = $this->prepareDocument($payload);
        $trackingId = (string) $document['tracking_id'];
        $indexName = $this->resolveIndexName($document);

        $this->logDocumentIndexer->index($indexName, $trackingId, $document);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function prepareDocument(array $payload): array
    {
        $processedAt = now()->toIso8601String();
        $receivedAt = isset($payload['received_at']) && is_string($payload['received_at']) && $payload['received_at'] !== ''
            ? $payload['received_at']
            : $processedAt;

        $maskedPayload = $this->sensitiveLogDataMasker->mask($payload);

        $maskedPayload['received_at'] = $receivedAt;
        $maskedPayload['processed_at'] = $processedAt;
        $maskedPayload['created_at'] = $receivedAt;

        return $maskedPayload;
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function resolveIndexName(array $document): string
    {
        $environment = isset($document['environment']) && is_string($document['environment']) && $document['environment'] !== ''
            ? strtolower($document['environment'])
            : 'unknown';

        $receivedAt = isset($document['received_at']) && is_string($document['received_at']) && $document['received_at'] !== ''
            ? CarbonImmutable::parse($document['received_at'])
            : CarbonImmutable::now();

        return sprintf('logs-%s-%s', $environment, $receivedAt->format('Y.m'));
    }
}
