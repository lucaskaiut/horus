<?php

namespace App\Modules\Auth\Domain\Services;

use App\Modules\Auth\Domain\Contracts\LoginChannel;
use InvalidArgumentException;

final class LoginChannelRegistry
{
    /**
     * @param  array<int, LoginChannel>  $channels
     */
    public function __construct(
        private readonly array $channels,
    ) {}

    /**
     * @return array<int, string>
     */
    public function keys(): array
    {
        return array_values(array_map(
            static fn (LoginChannel $channel): string => $channel->key(),
            $this->channels,
        ));
    }

    public function get(string $key): LoginChannel
    {
        foreach ($this->channels as $channel) {
            if ($channel->key() === $key) {
                return $channel;
            }
        }

        throw new InvalidArgumentException("Login channel [$key] não suportado.");
    }
}
