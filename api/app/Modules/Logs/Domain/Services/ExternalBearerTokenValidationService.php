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
            return TokenValidationResult::invalid();
        }

        return TokenValidationResult::fromAuthServerPayload($json);
    }

    private function sendTokenValidationRequest(string $bearerToken): Response
    {
        $timeout = (int) config('services.auth_server.timeout', 5);
        $absoluteUrl = (string) config('services.auth_server.token_validate_url', '');

        if ($absoluteUrl !== '') {
            return Http::timeout($timeout)
                ->withToken($bearerToken)
                ->acceptJson()
                ->asJson()
                ->get($absoluteUrl);
        }

        $baseUrl = (string) config('services.auth_server.base_url', '');
        $path = ltrim((string) config('services.auth_server.token_validate_path', 'api/token/validate'), '/');

        if ($baseUrl === '') {
            return Http::response(['valid' => false], 503);
        }

        return Http::baseUrl(rtrim($baseUrl, '/'))
            ->timeout($timeout)
            ->withToken($bearerToken)
            ->acceptJson()
            ->asJson()
            ->get('/'.$path);
    }
}
