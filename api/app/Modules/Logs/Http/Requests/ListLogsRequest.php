<?php

namespace App\Modules\Logs\Http\Requests;

use App\Modules\Logs\Http\Requests\Concerns\ValidatesCommonLogFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListLogsRequest extends FormRequest
{
    use ValidatesCommonLogFilters;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->prepareHasExceptionFilterBoolean();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['nullable', 'string', Rule::in(['received_at', 'processed_at', 'created_at'])],
            'order' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ], $this->commonLogFiltersRules());
    }
}
