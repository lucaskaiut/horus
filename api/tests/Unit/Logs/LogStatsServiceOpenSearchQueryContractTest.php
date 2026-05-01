<?php

namespace Tests\Unit\Logs;

use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;
use App\Modules\Logs\Domain\Services\LogFilterRegistry;
use App\Modules\Logs\Domain\Services\LogStatsService;
use PHPUnit\Framework\TestCase;

/**
 * Contrato da query enviada ao OpenSearch (evita 400 por campo text em terms ou parse em extended_bounds).
 */
final class LogStatsServiceOpenSearchQueryContractTest extends TestCase
{
    public function test_summary_query_matches_opensearch_expectations(): void
    {
        $bag = new \stdClass;
        $bag->payload = [];
        $bag->indexPattern = '';

        $searcher = new class($bag) implements LogDocumentSearcher
        {
            public function __construct(private \stdClass $bag) {}

            public function search(string $indexPattern, array $query): array
            {
                $this->bag->indexPattern = $indexPattern;
                $this->bag->payload = $query;

                return [
                    'hits' => ['total' => ['value' => 0], 'hits' => []],
                    'aggregations' => [
                        'by_level' => ['buckets' => []],
                        'by_channel' => ['buckets' => []],
                        'by_source' => ['buckets' => []],
                        'by_environment' => ['buckets' => []],
                        'with_exception' => ['doc_count' => 0],
                        'per_day' => ['buckets' => []],
                    ],
                ];
            }
        };

        $service = new LogStatsService($searcher, new LogFilterRegistry);
        $service->summarize(['histogram_days' => 14]);

        /** @var array<string, mixed> $q */
        $q = $bag->payload;

        $this->assertSame(0, $q['size']);
        $this->assertSame('logs-*', $bag->indexPattern);
        $this->assertArrayHasKey('query', $q);
        $this->assertArrayHasKey('aggs', $q);

        $this->assertSame('level.keyword', $q['aggs']['by_level']['terms']['field']);
        $this->assertSame('channel.keyword', $q['aggs']['by_channel']['terms']['field']);
        $this->assertSame('source.keyword', $q['aggs']['by_source']['terms']['field']);
        $this->assertSame('environment.keyword', $q['aggs']['by_environment']['terms']['field']);

        $dh = $q['aggs']['per_day']['date_histogram'];
        $this->assertSame('received_at', $dh['field']);
        $this->assertSame('day', $dh['calendar_interval']);
        $this->assertSame('yyyy-MM-dd', $dh['format']);

        $min = $dh['extended_bounds']['min'];
        $max = $dh['extended_bounds']['max'];
        $this->assertIsString($min);
        $this->assertIsString($max);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $min);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $max);
        $this->assertStringNotContainsString('T', $min);
        $this->assertStringNotContainsString('T', $max);
    }
}
