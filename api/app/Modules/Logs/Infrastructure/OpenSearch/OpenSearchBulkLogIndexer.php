<?php

namespace App\Modules\Logs\Infrastructure\OpenSearch;

use App\Modules\Logs\Domain\Services\SensitiveLogDataMasker;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class OpenSearchBulkLogIndexer
{
    public function __construct(
        private readonly SensitiveLogDataMasker $sensitiveLogDataMasker,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $payloads
     */
    public function bulkIndex(array $payloads): void
    {
        if ($payloads === []) {
            return;
        }

        $baseUrl = rtrim((string) config('services.opensearch.url', ''), '/');
        $timeout = (int) config('services.opensearch.timeout', 5);

        $processedAt = now()->toIso8601String();

        $body = '';
        foreach ($payloads as $payload) {
            $document = $this->prepareDocument($payload, $processedAt);
            $trackingId = (string) $document['tracking_id'];
            $indexName = $this->resolveIndexName($document);

            $body .= json_encode([
                'index' => [
                    '_index' => $indexName,
                    '_id' => $trackingId,
                ],
            ], JSON_UNESCAPED_SLASHES)."\n";

            $body .= json_encode($document, JSON_UNESCAPED_SLASHES)."\n";
        }

        $response = Http::baseUrl($baseUrl)
            ->timeout(max(30, $timeout))
            ->acceptJson()
            ->withBody($body, 'application/x-ndjson')
            ->post('/_bulk')
            ->throw();

        /** @var array<string, mixed>|null $json */
        $json = $response->json();

        if (is_array($json) && ($json['errors'] ?? false) === true) {
            $firstItem = is_array($json['items'] ?? null) ? ($json['items'][0] ?? null) : null;
            throw new RuntimeException('Falha ao indexar logs via bulk no OpenSearch.'.($firstItem ? ' First item: '.json_encode($firstItem) : ''));
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function prepareDocument(array $payload, string $processedAt): array
    {
        $receivedAt = isset($payload['received_at']) && is_string($payload['received_at']) && $payload['received_at'] !== ''
            ? $payload['received_at']
            : $processedAt;

        $masked = $this->sensitiveLogDataMasker->mask($payload);

        $masked['received_at'] = $receivedAt;
        $masked['processed_at'] = $processedAt;
        $masked['created_at'] = $receivedAt;

        return $masked;
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
