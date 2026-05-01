<?php

namespace App\Modules\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array{id:string,name:string,email:string} $resource
 */
final class RegisteredUserResource extends JsonResource
{
    /**
     * @return array<string, string>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) data_get($this->resource, 'id', ''),
            'name' => (string) data_get($this->resource, 'name', ''),
            'email' => (string) data_get($this->resource, 'email', ''),
        ];
    }
}
