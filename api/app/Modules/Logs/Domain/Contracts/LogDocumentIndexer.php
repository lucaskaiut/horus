<?php

namespace App\Modules\Logs\Domain\Contracts;

interface LogDocumentIndexer
{
    /**
     * @param  array<string, mixed>  $document
     */
    public function index(string $indexName, string $documentId, array $document): void;
}
