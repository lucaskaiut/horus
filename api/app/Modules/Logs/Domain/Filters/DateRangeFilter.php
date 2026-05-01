<?php

namespace App\Modules\Logs\Domain\Filters;

use Carbon\CarbonImmutable;

final class DateRangeFilter implements LogFilter
{
    public function __construct(
        private readonly string $field,
    ) {}

    /**
     * @param  array{from?:string|null,to?:string|null}|mixed  $value
     */
    public function apply(array &$bool, mixed $value): void
    {
        if (! is_array($value)) {
            return;
        }

        $from = isset($value['from']) && is_string($value['from']) && $value['from'] !== '' ? $value['from'] : null;
        $to = isset($value['to']) && is_string($value['to']) && $value['to'] !== '' ? $value['to'] : null;

        if ($from === null && $to === null) {
            return;
        }

        $range = [];

        if ($from !== null) {
            $range['gte'] = CarbonImmutable::parse($from)->toIso8601String();
        }

        if ($to !== null) {
            $range['lte'] = CarbonImmutable::parse($to)->toIso8601String();
        }

        $bool['filter'][] = [
            'range' => [
                $this->field => $range,
            ],
        ];
    }
}
