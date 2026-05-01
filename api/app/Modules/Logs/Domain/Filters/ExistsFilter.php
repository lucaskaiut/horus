<?php

namespace App\Modules\Logs\Domain\Filters;

final class ExistsFilter implements LogFilter
{
    public function __construct(
        private readonly string $field,
    ) {}

    public function apply(array &$bool, mixed $value): void
    {
        if (! is_bool($value)) {
            return;
        }

        if ($value === true) {
            $bool['filter'][] = ['exists' => ['field' => $this->field]];

            return;
        }

        $bool['must_not'][] = ['exists' => ['field' => $this->field]];
    }
}
