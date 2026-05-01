<?php

namespace Tests\Feature\Logs;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ListLogsTest extends TestCase
{
    public function test_list_logs_returns_paginated_data_and_applies_filters(): void
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
            'email' => 'api@example.com',
            'password' => 'password',
        ]);
        $token = $user->createToken('api')->plainTextToken;

        Http::fake([
            'https://os.test/logs-*/_search' => Http::response([
                'hits' => [
                    'total' => ['value' => 1],
                    'hits' => [
                        [
                            '_id' => '01JT18J1LQF5D6Q8XQ0Y2AZ123',
                            '_source' => [
                                'tracking_id' => '01JT18J1LQF5D6Q8XQ0Y2AZ123',
                                'level' => 'error',
                                'message' => 'Unexpected exception while processing order',
                                'message_search' => 'Unexpected exception while processing order',
                                'channel' => 'http',
                                'entity_name' => 'order',
                                'entity_id' => '123',
                                'received_at' => '2026-04-29T09:00:00+00:00',
                                'exception' => [
                                    'class' => 'RuntimeException',
                                    'message' => 'Failure',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/logs?filters[level]=error&filters[channel]=http&filters[message]=Unexpected&filters[received_at][from]=2026-04-01&filters[received_at][to]=2026-04-30&page=1&per_page=20&sort=received_at&order=desc', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'tracking_id',
                    'level',
                    'message',
                    'context',
                    'entity_name',
                    'entity_id',
                    'source',
                    'environment',
                    'channel',
                    'request_id',
                    'trace_id',
                    'user_id',
                    'ip_address',
                    'user_agent',
                    'exception',
                    'received_at',
                    'processed_at',
                    'created_at',
                ],
            ],
            'meta' => [
                'total',
                'page',
                'per_page',
            ],
        ]);

        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('meta.page', 1);
        $response->assertJsonPath('meta.per_page', 20);
        $response->assertJsonPath('data.0.tracking_id', '01JT18J1LQF5D6Q8XQ0Y2AZ123');
        $response->assertJsonPath('data.0.level', 'error');

        Http::assertSent(function ($request) {
            if ($request->url() !== 'https://os.test/logs-*/_search') {
                return false;
            }

            $payload = $request->data();

            return $request->method() === 'POST'
                && ($payload['from'] ?? null) === 0
                && ($payload['size'] ?? null) === 20
                && data_get($payload, 'sort.0.received_at.order') === 'desc';
        });
    }

    public function test_list_logs_uses_match_all_when_no_filters_are_provided(): void
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
            'email' => 'api@example.com',
            'password' => 'password',
        ]);
        $token = $user->createToken('api')->plainTextToken;

        Http::fake([
            'https://os.test/logs-*/_search' => Http::response([
                'hits' => [
                    'total' => ['value' => 0],
                    'hits' => [],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/logs?page=1&per_page=20&sort=received_at&order=desc', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('meta.total', 0);

        $captured = null;

        Http::assertSent(function ($request) use (&$captured) {
            if ($request->url() !== 'https://os.test/logs-*/_search') {
                return false;
            }

            /** @var array<string, mixed> $captured */
            $captured = $request->data();

            return $request->method() === 'POST';
        });

        $this->assertIsArray($captured);
        $this->assertIsArray($captured['query'] ?? null);
        $this->assertArrayHasKey('match_all', $captured['query']);
        $this->assertArrayNotHasKey('bool', $captured['query']);
    }
}
