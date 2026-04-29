<?php

namespace App\Modules\Logs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreLogRequest extends FormRequest
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
            'level' => ['required', 'string', Rule::in(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'])],
            'message' => ['required', 'string'],
            'context' => ['nullable', 'array'],
            'entity_name' => ['required_with:entity_id', 'nullable', 'string'],
            'entity_id' => ['required_with:entity_name', 'nullable', 'string'],
            'source' => ['required', 'string'],
            'environment' => ['required', 'string'],
            'channel' => ['nullable', 'string'],
            'request_id' => ['nullable', 'string'],
            'trace_id' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string'],
            'ip_address' => ['nullable', 'ip'],
            'user_agent' => ['nullable', 'string'],
            'exception' => ['nullable', 'array'],
            'exception.class' => ['nullable', 'string'],
            'exception.message' => ['nullable', 'string'],
            'exception.file' => ['nullable', 'string'],
            'exception.line' => ['nullable', 'integer', 'min:0'],
            'exception.stack_trace' => ['nullable', 'string'],
        ];
    }
}
