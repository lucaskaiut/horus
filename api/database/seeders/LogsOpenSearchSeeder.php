<?php

namespace Database\Seeders;

use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchBulkLogIndexer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Console\Helper\ProgressBar;

class LogsOpenSearchSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $opensearchUrl = (string) config('services.opensearch.url', '');
        if (trim($opensearchUrl) === '') {
            throw new RuntimeException('OPENSEARCH_URL não configurada (services.opensearch.url).');
        }

        /** @var OpenSearchBulkLogIndexer $bulkIndexer */
        $bulkIndexer = app(OpenSearchBulkLogIndexer::class);

        $levels = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
        $channels = ['http', 'queue', 'cli', 'worker', 'scheduler'];
        $sources = ['billing-api', 'orders-api', 'auth-api', 'web'];
        $environments = ['local', 'staging', 'production'];
        $entityNames = ['order', 'invoice', 'user', 'payment'];
        $exceptionClasses = ['RuntimeException', 'InvalidArgumentException', 'DomainException'];

        $count = (int) env('LOGS_SEED_COUNT', 1_000_000);
        $count = max(1, $count);

        $forcedEnvironment = (string) env('LOGS_SEED_ENV', 'local');
        $forcedEnvironment = trim($forcedEnvironment);

        $batchSize = (int) env('LOGS_SEED_BATCH', 1000);
        $batchSize = max(1, min(5000, $batchSize));

        $daysRange = (int) env('LOGS_SEED_DAYS_RANGE', 180);
        $daysRange = max(1, $daysRange);

        $progress = null;
        if ($this->command) {
            $progress = new ProgressBar($this->command->getOutput(), $count);
            $progress->setFormat(' %current%/%max% [%bar%] %percent:3s%% %elapsed:6s% %memory:6s%');
            $progress->start();
        }

        $batch = [];

        for ($i = 0; $i < $count; $i++) {
            $level = $levels[array_rand($levels)];
            $channel = $channels[array_rand($channels)];
            $source = $sources[array_rand($sources)];
            $environment = $forcedEnvironment === 'random' ? $environments[array_rand($environments)] : $forcedEnvironment;
            $entityName = $entityNames[array_rand($entityNames)];

            $trackingId = Str::ulid()->toString();
            $message = fake()->sentence(12);

            $receivedAt = fake()->dateTimeBetween(sprintf('-%d days', $daysRange), 'now')->format(DATE_ATOM);

            $hasException = fake()->boolean(35);
            $exception = $hasException
                ? [
                    'class' => $exceptionClasses[array_rand($exceptionClasses)],
                    'message' => fake()->sentence(8),
                    'file' => '/var/www/app/ExampleService.php',
                    'line' => fake()->numberBetween(1, 300),
                    'stack_trace' => fake()->text(400),
                ]
                : null;

            $payload = [
                'tracking_id' => $trackingId,
                'level' => $level,
                'message' => $message,
                'message_search' => $message,
                'context' => [
                    'seed' => true,
                    'iteration' => $i,
                    'request_id' => 'req-'.Str::ulid()->toString(),
                ],
                'entity_name' => $entityName,
                'entity_id' => (string) fake()->numberBetween(1, 1000),
                'source' => $source,
                'environment' => $environment,
                'channel' => $channel,
                'request_id' => 'req-'.Str::ulid()->toString(),
                'trace_id' => 'trace-'.Str::ulid()->toString(),
                'user_id' => fake()->boolean(60) ? (string) fake()->numberBetween(1, 500) : null,
                'ip_address' => fake()->boolean(70) ? fake()->ipv4() : null,
                'user_agent' => fake()->userAgent(),
                'exception' => $exception,
                'received_at' => $receivedAt,
            ];

            $batch[] = $payload;

            if (count($batch) >= $batchSize) {
                $bulkIndexer->bulkIndex($batch);
                $batch = [];

                if ($progress instanceof ProgressBar) {
                    $progress->advance($batchSize);
                }
            }
        }

        if ($batch !== []) {
            $bulkIndexer->bulkIndex($batch);
            if ($progress instanceof ProgressBar) {
                $progress->advance(count($batch));
            }
        }

        if ($progress instanceof ProgressBar) {
            $progress->finish();
            $this->command?->getOutput()->writeln('');
        }
    }
}
