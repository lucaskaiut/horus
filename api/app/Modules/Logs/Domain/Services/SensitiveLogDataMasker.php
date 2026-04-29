<?php

namespace App\Modules\Logs\Domain\Services;

final class SensitiveLogDataMasker
{
    /**
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'password',
        'token',
        'authorization',
        'card_number',
        'cvv',
        'secret',
        'api_key',
    ];

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function mask(array $payload): array
    {
        return $this->maskArray($payload);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function maskArray(array $data): array
    {
        $masked = [];

        foreach ($data as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (in_array($normalizedKey, self::SENSITIVE_KEYS, true)) {
                $masked[$key] = '[masked]';

                continue;
            }

            if (is_array($value)) {
                $masked[$key] = $this->maskArray($value);

                continue;
            }

            $masked[$key] = $value;
        }

        return $masked;
    }
}
