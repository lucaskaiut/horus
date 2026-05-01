<?php

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\Domain\Services\LoginChannelRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class LoginRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('channel')) {
            return;
        }

        /** @var array<string, mixed> $legacy */
        $legacy = $this->all();

        if (isset($legacy['login']) || isset($legacy['password'])) {
            $this->merge([
                'channel' => 'internal',
                'payload' => [
                    'email' => $legacy['login'] ?? null,
                    'password' => $legacy['password'] ?? null,
                ],
            ]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var LoginChannelRegistry $registry */
        $registry = $this->container->make(LoginChannelRegistry::class);
        $channel = (string) $this->input('channel', '');

        $payloadRules = [];
        if (in_array($channel, $registry->keys(), true)) {
            $payloadRules = $registry->get($channel)->payloadRules();
        }

        return [
            'channel' => ['required', 'string', Rule::in($registry->keys())],
            'payload' => ['required', 'array'],
            ...$payloadRules,
        ];
    }
}
