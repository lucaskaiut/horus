<?php

namespace App\Modules\Users\Domain\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class UserCrudService
{
    public function paginate(int $page, int $perPage): LengthAwarePaginator
    {
        return User::query()
            ->orderBy('id')
            ->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function create(array $data): User
    {
        return User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        if (array_key_exists('name', $data)) {
            $user->name = (string) $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = (string) $data['email'];
        }
        if (array_key_exists('password', $data) && $data['password'] !== null && $data['password'] !== '') {
            $user->password = (string) $data['password'];
        }
        $user->save();

        return $user->refresh();
    }

    public function delete(User $user): void
    {
        $user->delete();
    }
}
