<?php

namespace App\Modules\Logs\Infrastructure\OpenSearch;

use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;
use Illuminate\Support\Facades\Http;

final class OpenSearchLogDocumentSearcher implements LogDocumentSearcher
{
    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    public function search(string $indexPattern, array $query): array
    {
        $baseUrl = rtrim((string) config('services.opensearch.url', ''), '/');
        $timeout = (int) config('services.opensearch.timeout', 5);

        /** @var array<string, mixed> $json */
        $json = Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post(sprintf('/%s/_search', ltrim($indexPattern, '/')), $query)
            ->throw()
            ->json();

        return $json;
    }
}
