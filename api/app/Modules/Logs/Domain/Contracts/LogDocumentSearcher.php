<?php

namespace App\Modules\Logs\Domain\Contracts;

interface LogDocumentSearcher
{
    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    public function search(string $indexPattern, array $query): array;
}
