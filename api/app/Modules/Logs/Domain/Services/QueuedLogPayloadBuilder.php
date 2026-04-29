<?php

namespace App\Modules\Logs\Domain\Services;

use Illuminate\Http\Request;

final class QueuedLogPayloadBuilder
{
    /**
     * Monta o documento de ingestão alinhado ao modelo da especificação (OpenSearch).
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function buildPayloadForQueue(array $validated, string $trackingId, Request $request): array
    {
        $message = (string) $validated['message'];

        return [
            'tracking_id' => $trackingId,
            'level' => (string) $validated['level'],
            'message' => $message,
            'message_search' => $message,
            'context' => $this->normalizeContext($validated['context'] ?? null),
            'entity_name' => $this->nullableString($validated['entity_name'] ?? null),
            'entity_id' => $this->nullableString($validated['entity_id'] ?? null),
            'source' => $this->nullableString($validated['source'] ?? null),
            'environment' => $this->nullableString($validated['environment'] ?? null),
            'channel' => $this->nullableString($validated['channel'] ?? null),
            'request_id' => $this->nullableString($validated['request_id'] ?? null),
            'trace_id' => $this->nullableString($validated['trace_id'] ?? null),
            'user_id' => $this->nullableString($validated['user_id'] ?? null),
            'ip_address' => $this->resolveIpAddress($validated, $request),
            'user_agent' => $this->resolveUserAgent($validated, $request),
            'exception' => $this->normalizeException($validated['exception'] ?? null),
            'received_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeContext(mixed $context): array
    {
        if (! is_array($context)) {
            return [];
        }

        return $context;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeException(mixed $exception): ?array
    {
        if (! is_array($exception)) {
            return null;
        }

        return [
            'class' => isset($exception['class']) ? (string) $exception['class'] : null,
            'message' => isset($exception['message']) ? (string) $exception['message'] : null,
            'file' => isset($exception['file']) ? (string) $exception['file'] : null,
            'line' => isset($exception['line']) ? (int) $exception['line'] : null,
            'stack_trace' => isset($exception['stack_trace']) ? (string) $exception['stack_trace'] : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveIpAddress(array $validated, Request $request): ?string
    {
        if (isset($validated['ip_address']) && is_string($validated['ip_address']) && $validated['ip_address'] !== '') {
            return $validated['ip_address'];
        }

        return $request->ip();
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveUserAgent(array $validated, Request $request): ?string
    {
        if (isset($validated['user_agent']) && is_string($validated['user_agent']) && $validated['user_agent'] !== '') {
            return $validated['user_agent'];
        }

        $agent = $request->userAgent();

        return $agent !== '' ? $agent : null;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
