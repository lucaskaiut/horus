<?php

namespace App\Modules\Logs\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read string $tracking_id
 * @property-read string $message
 */
final class LogIngestResource extends JsonResource
{
    /**
     * @return array<string, string>
     */
    public function toArray(Request $request): array
    {
        return [
            'message' => (string) data_get($this->resource, 'message', ''),
            'tracking_id' => (string) data_get($this->resource, 'tracking_id', ''),
        ];
    }
}
