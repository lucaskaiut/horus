<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;

final class LogSearchService
{
    public function __construct(
        private readonly LogDocumentSearcher $logDocumentSearcher,
        private readonly LogFilterRegistry $filterRegistry,
    ) {}

    /**
     * @param  array{
     *  filters?: array<string, mixed>,
     *  page?: int,
     *  per_page?: int,
     *  sort?: string,
     *  order?: string
     * }  $validated
     * @return array{items:array<int, array<string, mixed>>, total:int, page:int, per_page:int}
     */
    public function search(array $validated): array
    {
        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? 50);
        $sort = (string) ($validated['sort'] ?? 'received_at');
        $order = (string) ($validated['order'] ?? 'desc');

        $bool = [
            'must' => [],
            'filter' => [],
            'must_not' => [],
        ];

        /** @var array<string, mixed> $filters */
        $filters = $validated['filters'] ?? [];
        $available = $this->filterRegistry->filters();

        foreach ($filters as $key => $value) {
            if (! isset($available[$key])) {
                continue;
            }

            $available[$key]->apply($bool, $value);
        }

        /** @var array<string, mixed> $boolQuery */
        $boolQuery = array_filter($bool, fn ($v) => is_array($v) && $v !== []);

        $query = [
            'from' => ($page - 1) * $perPage,
            'size' => $perPage,
            'track_total_hits' => true,
            'query' => $boolQuery === []
                ? ['match_all' => (object) []]
                : ['bool' => $boolQuery],
            'sort' => [
                [
                    $sort => [
                        'order' => $order,
                        'unmapped_type' => 'date',
                    ],
                ],
            ],
        ];

        $result = $this->logDocumentSearcher->search('logs-*', $query);

        /** @var array<int, array<string, mixed>> $hits */
        $hits = (array) data_get($result, 'hits.hits', []);
        $total = (int) data_get($result, 'hits.total.value', 0);

        $items = array_map(function (array $hit): array {
            /** @var array<string, mixed> $source */
            $source = (array) ($hit['_source'] ?? []);
            $source['_id'] = $hit['_id'] ?? null;

            return $source;
        }, $hits);

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }
}
