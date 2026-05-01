<?php

namespace App\Modules\Logs\Domain\Services;

final class AppliedLogFilters
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public static function clause(LogFilterRegistry $registry, array $filters): array
    {
        $bool = [
            'must' => [],
            'filter' => [],
            'must_not' => [],
        ];

        $available = $registry->filters();

        foreach ($filters as $key => $value) {
            if (! isset($available[$key])) {
                continue;
            }

            $available[$key]->apply($bool, $value);
        }

        /** @var array<string, mixed> $boolQuery */
        $boolQuery = array_filter($bool, fn ($v) => is_array($v) && $v !== []);

        return $boolQuery === []
            ? ['match_all' => (object) []]
            : ['bool' => $boolQuery];
    }
}
