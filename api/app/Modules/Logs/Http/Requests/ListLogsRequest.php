<?php

namespace App\Modules\Logs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['nullable', 'string', Rule::in(['received_at', 'processed_at', 'created_at'])],
            'order' => ['nullable', 'string', Rule::in(['asc', 'desc'])],

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
