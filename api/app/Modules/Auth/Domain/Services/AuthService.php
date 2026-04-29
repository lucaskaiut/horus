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
        $baseUrl = (string) config('services.auth_server.base_url', '');
        $timeout = (int) config('services.auth_server.timeout', 5);

        $response = Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post('/auth', [
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

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     */
    public function me(string $bearerToken): array
    {
        $baseUrl = (string) config('services.auth_server.base_url', '');
        $timeout = (int) config('services.auth_server.timeout', 5);

        return Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->withToken($bearerToken)
            ->acceptJson()
            ->asJson()
            ->get('/auth/me')
            ->throw()
            ->json();
    }
}
