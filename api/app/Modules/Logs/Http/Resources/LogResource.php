<?php

namespace App\Modules\Logs\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array<string, mixed> $resource
 */
final class LogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'tracking_id' => (string) data_get($this->resource, 'tracking_id', ''),
            'level' => data_get($this->resource, 'level'),
            'message' => data_get($this->resource, 'message'),
            'context' => data_get($this->resource, 'context'),
            'entity_name' => data_get($this->resource, 'entity_name'),
            'entity_id' => data_get($this->resource, 'entity_id'),
            'source' => data_get($this->resource, 'source'),
            'environment' => data_get($this->resource, 'environment'),
            'channel' => data_get($this->resource, 'channel'),
            'request_id' => data_get($this->resource, 'request_id'),
            'trace_id' => data_get($this->resource, 'trace_id'),
            'user_id' => data_get($this->resource, 'user_id'),
            'ip_address' => data_get($this->resource, 'ip_address'),
            'user_agent' => data_get($this->resource, 'user_agent'),
            'exception' => data_get($this->resource, 'exception'),
            'received_at' => data_get($this->resource, 'received_at'),
            'processed_at' => data_get($this->resource, 'processed_at'),
            'created_at' => data_get($this->resource, 'created_at'),
        ];
    }
}
