<?php

namespace App\Modules\Auth\Domain\Contracts;

use Illuminate\Http\Client\RequestException;
use Illuminate\Validation\ValidationException;

interface LoginChannel
{
    /**
     * Identificador do canal (ex.: "internal").
     */
    public function key(): string;

    /**
     * Regras específicas do payload do canal.
     *
     * @return array<string, mixed>
     */
    public function payloadRules(): array;

    /**
     * Executa o login para o canal.
     *
     * @param  array<string, mixed>  $payload
     * @return array{token:string,name:string,email:string}
     *
     * @throws ValidationException
     * @throws RequestException
     */
    public function login(array $payload): array;
}
