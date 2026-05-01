<?php

namespace App\Modules\Logs\Domain\Filters;

final class TermFilter implements LogFilter
{
    public function __construct(
        private readonly string $field,
    ) {}

    public function apply(array &$bool, mixed $value): void
    {
        if (! is_scalar($value) || (string) $value === '') {
            return;
        }

        $bool['filter'][] = [
            'term' => [
                $this->field => (string) $value,
            ],
        ];
    }
}
