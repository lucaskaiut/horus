<?php

namespace Tests\Feature\Logs;

use App\Models\User;
use App\Modules\Logs\Jobs\ProcessIncomingLogJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class StoreLogTest extends TestCase
{
    public function test_store_log_accepts_payload_and_dispatches_job(): void
    {
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

        Queue::fake();

        $response = $this->postJson('/api/logs', [
            'level' => 'error',
            'message' => 'Unexpected exception while processing order',
            'context' => [
                'order_id' => '123',
            ],
            'entity_name' => 'order',
            'entity_id' => '123',
            'source' => 'billing-api',
            'environment' => 'production',
            'channel' => 'http',
            'request_id' => 'req-123',
            'trace_id' => 'trace-123',
            'user_id' => 'user-123',
            'exception' => [
                'class' => 'RuntimeException',
                'message' => 'Failure',
                'file' => '/var/www/app/OrderService.php',
                'line' => 88,
                'stack_trace' => 'stack trace content',
            ],
        ], [
            'Authorization' => 'Bearer '.$token,
            'User-Agent' => 'FeatureTestAgent/1.0',
        ]);

        $response->assertAccepted();
        $response->assertJsonStructure([
            'message',
            'tracking_id',
        ]);
        $response->assertJson([
            'message' => 'Log recebido para processamento',
        ]);

        $trackingId = (string) $response->json('tracking_id');
        $this->assertTrue(Str::isUlid($trackingId));

        Http::assertNothingSent();

        Queue::assertPushed(ProcessIncomingLogJob::class, function (ProcessIncomingLogJob $job) use ($trackingId) {
            return $job->queue === 'logs'
                && $job->payload['tracking_id'] === $trackingId
                && $job->payload['level'] === 'error'
                && $job->payload['message'] === 'Unexpected exception while processing order'
                && $job->payload['entity_name'] === 'order'
                && $job->payload['entity_id'] === '123'
                && $job->payload['source'] === 'billing-api'
                && $job->payload['environment'] === 'production'
                && $job->payload['request_id'] === 'req-123'
                && $job->payload['trace_id'] === 'trace-123'
                && $job->payload['user_id'] === 'user-123'
                && $job->payload['user_agent'] === 'FeatureTestAgent/1.0'
                && is_string($job->payload['received_at']);
        });
    }

    public function test_store_log_returns_validation_error_when_entity_pair_is_incomplete(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('Driver de banco indisponível para testes com Sanctum.');
        }

        Queue::fake();

        $user = User::query()->create([
            'name' => 'API Client',
            'email' => 'api@example.com',
            'password' => 'password',
        ]);
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->postJson('/api/logs', [
            'level' => 'info',
            'message' => 'Order status updated',
            'entity_id' => '123',
            'source' => 'billing-api',
            'environment' => 'production',
        ], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['entity_name']);

        Queue::assertNothingPushed();
        Http::assertNothingSent();
    }
}
