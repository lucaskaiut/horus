<?php

namespace App\Modules\Logs\Domain\Filters;

final class TextContainsFilter implements LogFilter
{
    /**
     * @param  array<int, string>  $fields
     */
    public function __construct(
        private readonly array $fields,
    ) {}

    public function apply(array &$bool, mixed $value): void
    {
        if (! is_scalar($value)) {
            return;
        }

        $query = trim((string) $value);

        if ($query === '') {
            return;
        }

        $bool['must'][] = [
            'multi_match' => [
                'query' => $query,
                'fields' => $this->fields,
                'type' => 'phrase_prefix',
            ],
        ];
    }
}
