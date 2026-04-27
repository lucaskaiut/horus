<?php

namespace App\Modules\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array{token:string,name:string,email:string} $resource
 */
final class AuthResource extends JsonResource
{
    /**
     * @return array<string, string>
     */
    public function toArray(Request $request): array
    {
        return [
            'token' => (string) data_get($this->resource, 'token', ''),
            'name' => (string) data_get($this->resource, 'name', ''),
            'email' => (string) data_get($this->resource, 'email', ''),
        ];
    }
}

