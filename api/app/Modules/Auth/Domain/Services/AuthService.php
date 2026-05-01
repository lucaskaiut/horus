<?php

namespace App\Modules\Auth\Domain\Services;

use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Laravel\Sanctum\PersonalAccessToken;

final class AuthService
{
    public function __construct(
        private readonly LoginChannelRegistry $loginChannelRegistry,
    ) {}

    /**
     * @return array{token:string,name:string,email:string}
     *
     * @throws RequestException
     */
    public function login(string $channel, array $payload): array
    {
        $channelHandler = $this->loginChannelRegistry->get($channel);

        return $channelHandler->login($payload);
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }
}
