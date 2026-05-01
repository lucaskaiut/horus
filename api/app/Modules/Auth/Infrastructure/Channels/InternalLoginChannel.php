<?php

namespace App\Modules\Auth\Infrastructure\Channels;

use App\Models\User;
use App\Modules\Auth\Domain\Contracts\LoginChannel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class InternalLoginChannel implements LoginChannel
{
    public function key(): string
    {
        return 'internal';
    }

    public function payloadRules(): array
    {
        return [
            'payload.email' => ['required', 'email'],
            'payload.password' => ['required', 'string'],
        ];
    }

    public function login(array $payload): array
    {
        $email = (string) data_get($payload, 'email', '');
        $password = (string) data_get($payload, 'password', '');

        /** @var User|null $user */
        $user = User::query()
            ->where('email', $email)
            ->first();

        if (! $user || ! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages([
                'payload.email' => ['Credenciais inválidas.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return [
            'token' => $token,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
        ];
    }
}
