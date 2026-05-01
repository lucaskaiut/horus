<?php

namespace Tests\Feature\Logs;

use App\Modules\Logs\Domain\Services\LogStatsService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Executa a query real contra um OpenSearch acessível (ex.: docker compose).
 *
 * Por padrão o teste é ignorado. Para rodar:
 * RUN_OPENSEARCH_SUMMARY_IT=1 e services.opensearch.url apontando para a instância.
 */
final class LogStatsSummaryOpenSearchIntegrationTest extends TestCase
{
    public function test_summary_service_succeeds_against_live_opensearch(): void
    {
        if (! filter_var(env('RUN_OPENSEARCH_SUMMARY_IT', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->markTestSkipped('Defina RUN_OPENSEARCH_SUMMARY_IT=1 para integração com OpenSearch.');
        }

        $base = rtrim((string) config('services.opensearch.url'), '/');
        if ($base === '') {
            $this->markTestSkipped('services.opensearch.url vazio.');
        }

        $month = now()->format('Y.m');
        $index = sprintf('logs-summaryit-local-%s', $month);

        Http::timeout(15)->baseUrl($base)->delete('/'.$index);

        try {
            $put = Http::timeout(15)->baseUrl($base)->put('/'.$index, (object) []);
            if (! $put->successful()) {
                $this->fail('Falha ao criar índice de teste no OpenSearch: '.$put->body());
            }

            $action = json_encode(['index' => ['_index' => $index, '_id' => 'summary-it-1']], JSON_UNESCAPED_SLASHES);
            $doc = json_encode([
                'tracking_id' => 'summary-it-1',
                'level' => 'info',
                'message' => 'integration summary',
                'message_search' => 'integration summary',
                'channel' => 'http',
                'source' => 'test-api',
                'environment' => 'local',
                'received_at' => now()->utc()->subHours(2)->toIso8601String(),
                'exception' => null,
            ], JSON_UNESCAPED_SLASHES);

            $bulk = Http::timeout(30)
                ->baseUrl($base)
                ->withBody($action."\n".$doc."\n", 'application/x-ndjson')
                ->post('/_bulk');
            $bulk->throw();

            $bulkJson = $bulk->json();
            if (is_array($bulkJson) && ($bulkJson['errors'] ?? false) === true) {
                $this->fail('Bulk indexação retornou errors=true: '.json_encode($bulkJson));
            }

            Http::timeout(15)->baseUrl($base)->post('/'.$index.'/_refresh')->throw();

            /** @var LogStatsService $service */
            $service = $this->app->make(LogStatsService::class);
            $result = $service->summarize(['histogram_days' => 7]);

            $this->assertGreaterThanOrEqual(1, $result['total'], 'Deveria contar o documento indexado.');
            $this->assertNotEmpty($result['histogram'], 'Histograma deveria retornar buckets.');
        } finally {
            Http::timeout(10)->baseUrl($base)->delete('/'.$index);
        }
    }
}
