<?php

namespace Tests\Unit\Logs;

use App\Modules\Logs\Domain\Contracts\LogDocumentIndexer;
use App\Modules\Logs\Domain\Services\ProcessIncomingLogService;
use App\Modules\Logs\Domain\Services\SensitiveLogDataMasker;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProcessIncomingLogServiceTest extends TestCase
{
    #[Test]
    public function it_indexes_the_processed_log_document_in_opensearch(): void
    {
        Carbon::setTestNow('2026-04-29 10:30:00');

        $indexer = new class implements LogDocumentIndexer
        {
            public ?string $capturedIndexName = null;

            public ?string $capturedDocumentId = null;

            /**
             * @var array<string, mixed>|null
             */
            public ?array $capturedDocument = null;

            /**
             * @param  array<string, mixed>  $document
             */
            public function index(string $indexName, string $documentId, array $document): void
            {
                $this->capturedIndexName = $indexName;
                $this->capturedDocumentId = $documentId;
                $this->capturedDocument = $document;
            }
        };

        $service = new ProcessIncomingLogService(
            logDocumentIndexer: $indexer,
            sensitiveLogDataMasker: new SensitiveLogDataMasker(),
        );

        $service->process([
            'tracking_id' => '01JT18J1LQF5D6Q8XQ0Y2AZ123',
            'level' => 'error',
            'message' => 'Unexpected exception while processing order',
            'message_search' => 'Unexpected exception while processing order',
            'context' => [
                'password' => 'secret-value',
                'nested' => [
                    'token' => 'abc123',
                ],
            ],
            'source' => 'billing-api',
            'environment' => 'production',
            'request_id' => 'req-123',
            'trace_id' => 'trace-123',
            'user_id' => 'user-123',
            'exception' => [
                'message' => 'Failure',
                'stack_trace' => 'stack trace content',
                'api_key' => 'sensitive-key',
            ],
            'received_at' => '2026-04-29T09:00:00+00:00',
        ]);

        $this->assertSame('logs-production-2026.04', $indexer->capturedIndexName);
        $this->assertSame('01JT18J1LQF5D6Q8XQ0Y2AZ123', $indexer->capturedDocumentId);
        $this->assertIsArray($indexer->capturedDocument);
        $this->assertSame('[masked]', $indexer->capturedDocument['context']['password']);
        $this->assertSame('[masked]', $indexer->capturedDocument['context']['nested']['token']);
        $this->assertSame('[masked]', $indexer->capturedDocument['exception']['api_key']);
        $this->assertSame('2026-04-29T09:00:00+00:00', $indexer->capturedDocument['received_at']);
        $this->assertSame('2026-04-29T09:00:00+00:00', $indexer->capturedDocument['created_at']);
        $this->assertSame(
            CarbonImmutable::parse('2026-04-29 10:30:00')->toIso8601String(),
            $indexer->capturedDocument['processed_at']
        );

        Carbon::setTestNow();
    }
}
