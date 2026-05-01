<?php

namespace App\Modules\Logs\Http\Requests;

use App\Modules\Logs\Http\Requests\Concerns\ValidatesCommonLogFilters;
use Illuminate\Foundation\Http\FormRequest;

final class DashboardLogsRequest extends FormRequest
{
    use ValidatesCommonLogFilters;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge([
            'histogram_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ], $this->commonLogFiltersRules());
    }

    protected function prepareForValidation(): void
    {
        $this->prepareHasExceptionFilterBoolean();
    }
}
