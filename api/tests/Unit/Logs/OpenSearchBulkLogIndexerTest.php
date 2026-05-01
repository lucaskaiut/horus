<?php

namespace Tests\Unit\Logs;

use App\Modules\Logs\Domain\Services\SensitiveLogDataMasker;
use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchBulkLogIndexer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class OpenSearchBulkLogIndexerTest extends TestCase
{
    public function test_it_sends_ndjson_bulk_payload_to_opensearch(): void
    {
        config()->set('services.opensearch.url', 'https://os.test');
        config()->set('services.opensearch.timeout', 5);

        Http::fake([
            'https://os.test/_bulk' => Http::response(['errors' => false, 'items' => []], 200),
        ]);

        $indexer = new OpenSearchBulkLogIndexer(new SensitiveLogDataMasker);
        $trackingId = Str::ulid()->toString();

        $indexer->bulkIndex([
            [
                'tracking_id' => $trackingId,
                'level' => 'info',
                'message' => 'hello',
                'message_search' => 'hello',
                'context' => ['password' => 'secret'],
                'source' => 'web',
                'environment' => 'local',
                'received_at' => '2026-05-01T10:00:00+00:00',
            ],
        ]);

        Http::assertSent(function ($request) use ($trackingId) {
            if ($request->url() !== 'https://os.test/_bulk') {
                return false;
            }

            $body = (string) $request->body();
            $contentType = (string) $request->header('Content-Type')[0];

            return $request->method() === 'POST'
                && str_contains($body, '"_id":"'.$trackingId.'"')
                && str_contains($body, '"_index":"logs-local-2026.05"')
                && str_contains($body, '"password":"[masked]"')
                && $contentType === 'application/x-ndjson';
        });
    }
}
