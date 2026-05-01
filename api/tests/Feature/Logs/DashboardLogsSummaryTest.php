<?php

namespace Tests\Feature\Logs;

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DashboardLogsSummaryTest extends TestCase
{
    public function test_dashboard_summary_returns_aggregates_and_respects_histogram_days(): void
    {
        config()->set('services.opensearch.url', 'https://os.test');
        config()->set('services.opensearch.timeout', 5);

        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes com Sanctum.');
        }

        $user = User::query()->create([
            'name' => 'API Client',
            'email' => 'api-dash@example.com',
            'password' => 'password',
        ]);
        $token = $user->createToken('api')->plainTextToken;

        Http::fake([
            'https://os.test/logs-*/_search' => Http::response([
                'hits' => [
                    'total' => ['value' => 42],
                    'hits' => [],
                ],
                'aggregations' => [
                    'by_level' => [
                        'buckets' => [
                            ['key' => 'error', 'doc_count' => 30],
                            ['key' => 'warning', 'doc_count' => 12],
                        ],
                    ],
                    'by_channel' => [
                        'buckets' => [
                            ['key' => 'http', 'doc_count' => 42],
                        ],
                    ],
                    'by_source' => [
                        'buckets' => [
                            ['key' => 'billing-api', 'doc_count' => 20],
                        ],
                    ],
                    'by_environment' => [
                        'buckets' => [
                            ['key' => 'staging', 'doc_count' => 42],
                        ],
                    ],
                    'with_exception' => [
                        'doc_count' => 7,
                    ],
                    'per_day' => [
                        'buckets' => [
                            ['key_as_string' => '2026-04-01', 'doc_count' => 10],
                            ['key_as_string' => '2026-04-02', 'doc_count' => 11],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/logs/summary?histogram_days=7', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.total', 42);
        $response->assertJsonPath('data.with_exception_count', 7);
        $response->assertJsonPath('data.period.histogram_days', 7);
        $response->assertJsonPath('data.by_level.0.key', 'error');
        $response->assertJsonPath('data.by_level.0.count', 30);
        $response->assertJsonPath('data.histogram.0.date', '2026-04-01');
        $response->assertJsonPath('data.histogram.0.count', 10);

        Http::assertSent(function (Request $request): bool {
            if ($request->url() !== 'https://os.test/logs-*/_search') {
                return false;
            }

            $payload = $request->data();

            if (($payload['size'] ?? null) !== 0 || ! isset($payload['aggs']['per_day'], $payload['query'])) {
                return false;
            }

            $dh = $payload['aggs']['per_day']['date_histogram'] ?? null;
            if (! is_array($dh)) {
                return false;
            }

            $min = $dh['extended_bounds']['min'] ?? null;
            $max = $dh['extended_bounds']['max'] ?? null;
            if (! is_string($min) || ! is_string($max) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $min) !== 1 || preg_match('/^\d{4}-\d{2}-\d{2}$/', $max) !== 1) {
                return false;
            }

            return ($payload['aggs']['by_level']['terms']['field'] ?? null) === 'level.keyword'
                && ($payload['aggs']['by_channel']['terms']['field'] ?? null) === 'channel.keyword'
                && ($payload['aggs']['by_source']['terms']['field'] ?? null) === 'source.keyword'
                && ($payload['aggs']['by_environment']['terms']['field'] ?? null) === 'environment.keyword'
                && ($dh['format'] ?? null) === 'yyyy-MM-dd';
        });
    }
}
