<?php

namespace App\Modules\Logs\Infrastructure\OpenSearch;

use App\Modules\Logs\Domain\Contracts\LogDocumentIndexer;
use Illuminate\Support\Facades\Http;

final class OpenSearchLogDocumentIndexer implements LogDocumentIndexer
{
    /**
     * @param  array<string, mixed>  $document
     */
    public function index(string $indexName, string $documentId, array $document): void
    {
        $baseUrl = rtrim((string) config('services.opensearch.url', ''), '/');
        $timeout = (int) config('services.opensearch.timeout', 5);

        Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->put(sprintf('/%s/_doc/%s', $indexName, $documentId), $document)
            ->throw();
    }
}
