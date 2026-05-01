<?php

namespace App\Modules\Auth\Domain\Services;

use App\Models\User;

final class RegisterUserService
{
    /**
     * @return array{id:string,name:string,email:string}
     */
    public function register(string $name, string $email, string $password): array
    {
        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        return [
            'id' => (string) $user->getKey(),
            'name' => (string) $user->name,
            'email' => (string) $user->email,
        ];
    }
}
