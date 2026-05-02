<?php

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BulkSeedLogsCommandTest extends TestCase
{
    public function test_dry_run_does_not_require_opensearch_and_sends_no_http(): void
    {
        config()->set('services.opensearch.url', '');

        Http::fake();

        $this->artisan('logs:bulk-seed', [
            '--count' => 12,
            '--batch' => 5,
            '--dry-run' => true,
        ])->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_high_count_without_force_fails(): void
    {
        config()->set('services.opensearch.url', 'https://os.test');

        $this->artisan('logs:bulk-seed', [
            '--count' => 500_001,
        ])->assertFailed();
    }

    public function test_indexes_batches_via_bulk_when_forced(): void
    {
        config()->set('services.opensearch.url', 'https://os.test');
        config()->set('services.opensearch.timeout', 5);

        Http::fake([
            'https://os.test/_bulk' => Http::response(['errors' => false, 'items' => []], 200),
        ]);

        $this->artisan('logs:bulk-seed', [
            '--count' => 5,
            '--batch' => 2,
            '--force' => true,
            '--days' => 10,
        ])->assertSuccessful();

        Http::assertSentCount(3);
    }
}
