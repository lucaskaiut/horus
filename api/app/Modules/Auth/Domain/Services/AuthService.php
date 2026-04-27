<?php

namespace App\Modules\Auth\Domain\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

final class AuthService
{
    /**
     * @return array{token:string,name:string,email:string}
     *
     * @throws RequestException
     */
    public function login(string $login, string $password, ?string $google2faValidation): array
    {
        $url = (string) config('services.auth_server.url', '');
        $timeout = (int) config('services.auth_server.timeout', 5);

        $response = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post($url, [
                'login' => $login,
                'password' => $password,
                'google2faValidation' => $google2faValidation,
            ])
            ->throw();

        $json = $response->json();

        return [
            'token' => (string) data_get($json, 'content.token', ''),
            'name' => (string) data_get($json, 'content.name', ''),
            'email' => (string) data_get($json, 'content.email', ''),
        ];
    }
}

