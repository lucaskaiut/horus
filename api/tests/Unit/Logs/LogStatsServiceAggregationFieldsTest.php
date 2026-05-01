<?php

namespace Tests\Unit\Logs;

use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;
use App\Modules\Logs\Domain\Services\LogFilterRegistry;
use App\Modules\Logs\Domain\Services\LogStatsService;
use PHPUnit\Framework\TestCase;

final class LogStatsServiceAggregationFieldsTest extends TestCase
{
    public function test_terms_aggregations_use_keyword_subfields_for_opensearch(): void
    {
        $bag = new \stdClass;
        $bag->payload = [];

        $searcher = new class($bag) implements LogDocumentSearcher
        {
            public function __construct(private \stdClass $bag) {}

            public function search(string $indexPattern, array $query): array
            {
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

        /** @var array<string, mixed> $captured */
        $captured = $bag->payload;

        $this->assertSame('level.keyword', $captured['aggs']['by_level']['terms']['field']);
        $this->assertSame('channel.keyword', $captured['aggs']['by_channel']['terms']['field']);
        $this->assertSame('source.keyword', $captured['aggs']['by_source']['terms']['field']);
        $this->assertSame('environment.keyword', $captured['aggs']['by_environment']['terms']['field']);
        $this->assertSame(0, $captured['size']);
    }
}
