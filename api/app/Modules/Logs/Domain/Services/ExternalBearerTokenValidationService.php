<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\ValueObjects\TokenValidationResult;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

final class ExternalBearerTokenValidationService
{
    public function validateBearerToken(string $bearerToken): TokenValidationResult
    {
        if ($bearerToken === '') {
            return TokenValidationResult::invalid();
        }

        $response = $this->sendTokenValidationRequest($bearerToken);

        if ($response->failed()) {
            return TokenValidationResult::invalid();
        }

        $json = $response->json();

        if (! is_array($json)) {
            return TokenValidationResult::valid();
        }

        return TokenValidationResult::valid(
            clientId: isset($json['id']) ? (string) $json['id'] : null,
            clientName: (string) data_get($json, 'content.name', data_get($json, 'name')),
            clientEmail: (string) data_get($json, 'content.email', data_get($json, 'email')),
        );
    }

    private function sendTokenValidationRequest(string $bearerToken): Response
    {
        $timeout = (int) config('services.auth_server.timeout', 5);
        $baseUrl = (string) config('services.auth_server.base_url', '');

        if ($baseUrl === '') {
            return Http::response(['valid' => false], 503);
        }

        return Http::baseUrl(rtrim($baseUrl, '/'))
            ->timeout($timeout)
            ->withToken($bearerToken)
            ->acceptJson()
            ->asJson()
            ->get('/auth/me');
    }
}
