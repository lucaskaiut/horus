<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /**
         * Este projeto não depende de banco de dados para funcionar.
         * Mantemos o DatabaseSeeder vazio para evitar exigir driver/conexão.
         *
         * Para popular o OpenSearch com logs, rode:
         * php artisan db:seed --class=Database\\Seeders\\LogsOpenSearchSeeder
         */
    }
}
