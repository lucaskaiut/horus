<?php

namespace App\Modules\Logs\Http\Requests\Concerns;

use Illuminate\Validation\Rule;

trait ValidatesCommonLogFilters
{
    protected function prepareHasExceptionFilterBoolean(): void
    {
        if (! $this->has('filters.has_exception')) {
            return;
        }

        $raw = $this->input('filters.has_exception');
        $coerced = filter_var($raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if (! is_bool($coerced)) {
            return;
        }

        $this->merge([
            'filters' => array_merge((array) $this->input('filters', []), [
                'has_exception' => $coerced,
            ]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function commonLogFiltersRules(): array
    {
        return [
            'filters' => ['nullable', 'array'],

            'filters.message' => ['nullable', 'string', 'max:500'],

            'filters.level' => ['nullable', 'string', Rule::in(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'])],
            'filters.channel' => ['nullable', 'string', 'max:120'],
            'filters.source' => ['nullable', 'string', 'max:120'],
            'filters.environment' => ['nullable', 'string', 'max:120'],
            'filters.entity_name' => ['nullable', 'string', 'max:120'],
            'filters.entity_id' => ['nullable', 'string', 'max:120'],
            'filters.request_id' => ['nullable', 'string', 'max:120'],
            'filters.trace_id' => ['nullable', 'string', 'max:120'],
            'filters.user_id' => ['nullable', 'string', 'max:120'],
            'filters.ip_address' => ['nullable', 'ip'],
            'filters.tracking_id' => ['nullable', 'string', 'max:120'],

            'filters.has_exception' => ['nullable', 'boolean'],
            'filters.exception_class' => ['nullable', 'string', 'max:200'],

            'filters.received_at' => ['nullable', 'array'],
            'filters.received_at.from' => ['nullable', 'date'],
            'filters.received_at.to' => ['nullable', 'date'],

            'filters.processed_at' => ['nullable', 'array'],
            'filters.processed_at.from' => ['nullable', 'date'],
            'filters.processed_at.to' => ['nullable', 'date'],

            'filters.created_at' => ['nullable', 'array'],
            'filters.created_at.from' => ['nullable', 'date'],
            'filters.created_at.to' => ['nullable', 'date'],
        ];
    }
}
