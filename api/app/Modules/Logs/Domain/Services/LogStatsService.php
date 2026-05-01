<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;
use Carbon\CarbonImmutable;

final class LogStatsService
{
    public function __construct(
        private readonly LogDocumentSearcher $logDocumentSearcher,
        private readonly LogFilterRegistry $filterRegistry,
    ) {}

    /**
     * @param  array{
     *     filters?: array<string, mixed>,
     *     histogram_days?: int|null
     * }  $validated
     * @return array{
     *     total: int,
     *     with_exception_count: int,
     *     period: array{from: string, to: string, histogram_days: int},
     *     by_level: array<int, array{key: string, count: int}>,
     *     by_channel: array<int, array{key: string, count: int}>,
     *     by_source: array<int, array{key: string, count: int}>,
     *     by_environment: array<int, array{key: string, count: int}>,
     *     histogram: array<int, array{date: string, count: int}>
     * }
     */
    public function summarize(array $validated): array
    {
        $histogramDaysRaw = isset($validated['histogram_days'])
            ? (int) $validated['histogram_days']
            : null;
        $histogramDays = $histogramDaysRaw !== null ? max(1, min(90, $histogramDaysRaw)) : 14;

        $histToUtc = CarbonImmutable::now('UTC')->startOfDay();
        $histFromUtc = $histToUtc->subDays(max(1, $histogramDays) - 1);

        /** @var array<string, mixed> $filters */
        $filters = isset($validated['filters']) && is_array($validated['filters'])
            ? $validated['filters']
            : [];

        $filters['received_at'] = [
            'from' => $histFromUtc->toDateString(),
            'to' => $histToUtc->toDateString(),
        ];

        /** @var array<string, mixed> $queryClause */
        $queryClause = AppliedLogFilters::clause($this->filterRegistry, $filters);

        // `terms` em campos mapeados como `text` (mapeamento dinâmico) exige o subcampo `.keyword`.
        // `extended_bounds` do date_histogram com `format: yyyy-MM-dd` deve usar o mesmo formato (não ISO8601 com hora).
        $query = [
            'size' => 0,
            'track_total_hits' => true,
            'query' => $queryClause,
            'aggs' => [
                'by_level' => [
                    'terms' => [
                        'field' => 'level.keyword',
                        'size' => 20,
                        'order' => ['_count' => 'desc'],
                    ],
                ],
                'by_channel' => [
                    'terms' => [
                        'field' => 'channel.keyword',
                        'size' => 20,
                        'order' => ['_count' => 'desc'],
                    ],
                ],
                'by_source' => [
                    'terms' => [
                        'field' => 'source.keyword',
                        'size' => 25,
                        'order' => ['_count' => 'desc'],
                    ],
                ],
                'by_environment' => [
                    'terms' => [
                        'field' => 'environment.keyword',
                        'size' => 15,
                        'order' => ['_count' => 'desc'],
                    ],
                ],
                'with_exception' => [
                    'filter' => [
                        'exists' => [
                            'field' => 'exception',
                        ],
                    ],
                ],
                'per_day' => [
                    'date_histogram' => [
                        'field' => 'received_at',
                        'calendar_interval' => 'day',
                        'min_doc_count' => 0,
                        'format' => 'yyyy-MM-dd',
                        'extended_bounds' => [
                            'min' => $histFromUtc->toDateString(),
                            'max' => $histToUtc->toDateString(),
                        ],
                    ],
                ],
            ],
        ];

        $result = $this->logDocumentSearcher->search('logs-*', $query);

        return [
            'total' => (int) data_get($result, 'hits.total.value', 0),
            'with_exception_count' => (int) data_get($result, 'aggregations.with_exception.doc_count', 0),
            'period' => [
                'from' => $histFromUtc->toDateString(),
                'to' => $histToUtc->toDateString(),
                'histogram_days' => max(1, $histogramDays),
            ],
            'by_level' => $this->mapTermBuckets(data_get($result, 'aggregations.by_level')),
            'by_channel' => $this->mapTermBuckets(data_get($result, 'aggregations.by_channel')),
            'by_source' => $this->mapTermBuckets(data_get($result, 'aggregations.by_source')),
            'by_environment' => $this->mapTermBuckets(data_get($result, 'aggregations.by_environment')),
            'histogram' => $this->mapDateHistogramBuckets(data_get($result, 'aggregations.per_day')),
        ];
    }

    /**
     * @return array<int, array{key: string, count: int}>
     */
    private function mapTermBuckets(mixed $aggregation): array
    {
        if (! is_array($aggregation)) {
            return [];
        }

        $buckets = $aggregation['buckets'] ?? null;
        if (! is_array($buckets)) {
            return [];
        }

        $out = [];
        foreach ($buckets as $bucket) {
            if (! is_array($bucket)) {
                continue;
            }

            $raw = $bucket['key'] ?? '';
            if (is_array($raw)) {
                continue;
            }

            $keyLabel = $raw === '' || $raw === null ? '(vazio)' : (is_scalar($raw) ? (string) $raw : '');

            $out[] = [
                'key' => $keyLabel,
                'count' => (int) ($bucket['doc_count'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * @return array<int, array{date: string, count: int}>
     */
    private function mapDateHistogramBuckets(mixed $aggregation): array
    {
        if (! is_array($aggregation)) {
            return [];
        }

        $buckets = $aggregation['buckets'] ?? null;
        if (! is_array($buckets)) {
            return [];
        }

        $out = [];
        foreach ($buckets as $bucket) {
            if (! is_array($bucket)) {
                continue;
            }

            $date = null;
            if (isset($bucket['key_as_string']) && is_string($bucket['key_as_string'])) {
                $date = $bucket['key_as_string'];
            } elseif (array_key_exists('key', $bucket)) {
                if (is_string($bucket['key'])) {
                    $date = $bucket['key'];
                } elseif (is_scalar($bucket['key'])) {
                    /**
                     * @var int|string|float|bool $k
                     */
                    $k = $bucket['key'];
                    $date = CarbonImmutable::createFromTimestampMs((int) $k)->toDateString();
                }
            }

            if ($date === null) {
                continue;
            }

            $out[] = [
                'date' => substr($date, 0, 10),
                'count' => (int) ($bucket['doc_count'] ?? 0),
            ];
        }

        return $out;
    }
}
