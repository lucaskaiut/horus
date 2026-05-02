<?php

namespace App\Console\Commands;

use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchBulkLogIndexer;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use RuntimeException;

final class BulkSeedLogsCommand extends Command
{
    protected $signature = 'logs:bulk-seed
                            {--count=2000000 : Número de documentos a gerar}
                            {--batch=1000 : Tamanho do lote enviado ao _bulk (1–5000)}
                            {--days=365 : Distribuir received_at entre agora e N dias atrás}
                            {--environment=production : Valor do campo environment (ou "random" para alternar)}
                            {--dry-run : Não chama o OpenSearch; só simula o fluxo}
                            {--force : Obrigatório quando --count > 500000 (exceto com --dry-run)}';

    protected $description = 'Gera documentos de log sintéticos e indexa no OpenSearch via bulk (sem Faker; adequado a produção)';

    /** @var list<string> */
    private const LEVELS = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];

    /** @var list<string> */
    private const CHANNELS = ['http', 'queue', 'cli', 'worker', 'scheduler'];

    /** @var list<string> */
    private const SOURCES = ['billing-api', 'orders-api', 'auth-api', 'web'];

    /** @var list<string> */
    private const ENVIRONMENTS = ['local', 'staging', 'production'];

    /** @var list<string> */
    private const ENTITY_NAMES = ['order', 'invoice', 'user', 'payment'];

    /** @var list<string> */
    private const EXCEPTION_CLASSES = ['RuntimeException', 'InvalidArgumentException', 'DomainException'];

    /** @var list<string> */
    private const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'LoggerBot/1.0 (+https://example.internal/health)',
    ];

    /** @var list<string> */
    private const VOCAB = [
        'payment', 'checkout', 'timeout', 'user', 'session', 'cart', 'refund', 'webhook',
        'queue', 'retry', 'cache', 'database', 'token', 'order', 'shipment', 'invoice',
        'rate', 'limit', 'upstream', 'latency', 'circuit', 'breaker', 'validation', 'payload',
    ];

    public function __construct(
        private readonly OpenSearchBulkLogIndexer $bulkIndexer,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $count = max(1, (int) $this->option('count'));
        $batchSize = max(1, min(5000, (int) $this->option('batch')));
        $daysRange = max(1, (int) $this->option('days'));
        $environmentOption = trim((string) $this->option('environment'));

        if ($count > 500_000 && ! $dryRun && ! $this->option('force')) {
            $this->error('Para mais de 500000 documentos fora de --dry-run, passe também --force.');

            return self::FAILURE;
        }

        if (! $dryRun) {
            $opensearchUrl = (string) config('services.opensearch.url', '');
            if (trim($opensearchUrl) === '') {
                throw new RuntimeException('OPENSEARCH_URL não configurada (services.opensearch.url).');
            }
        }

        $progress = $this->output->createProgressBar($count);
        $progress->setFormat(' %current%/%max% [%bar%] %percent:3s%% %elapsed:6s% %memory:6s%');
        $progress->start();

        $batch = [];
        $rng = $this->makeRng(0x13579BDF);

        for ($i = 0; $i < $count; $i++) {
            $batch[] = $this->buildPayload($i, $daysRange, $environmentOption, $rng);

            if (count($batch) >= $batchSize) {
                if (! $dryRun) {
                    $this->bulkIndexer->bulkIndex($batch);
                }
                $progress->advance(count($batch));
                $batch = [];
            }
        }

        if ($batch !== []) {
            if (! $dryRun) {
                $this->bulkIndexer->bulkIndex($batch);
            }
            $progress->advance(count($batch));
        }

        $progress->finish();
        $this->newLine();

        if ($dryRun) {
            $this->info(sprintf('Dry-run: %d documentos simulados (batch=%d, days=%d).', $count, $batchSize, $daysRange));
        } else {
            $this->info(sprintf('Indexados %d documentos (batch=%d, days=%d).', $count, $batchSize, $daysRange));
        }

        return self::SUCCESS;
    }

    /**
     * @return \Closure(): int
     */
    private function makeRng(int $seed): \Closure
    {
        $state = $seed & 0x7FFFFFFF;

        return static function () use (&$state): int {
            $state = ($state * 1103515245 + 12345) & 0x7FFFFFFF;

            return $state;
        };
    }

    /**
     * @param  \Closure(): int  $rng
     * @return array<string, mixed>
     */
    private function buildPayload(int $iteration, int $daysRange, string $environmentOption, \Closure $rng): array
    {
        $pick = static function (array $items) use ($rng): string {
            $idx = ($rng()) % count($items);

            return $items[$idx];
        };

        $level = $pick(self::LEVELS);
        $channel = $pick(self::CHANNELS);
        $source = $pick(self::SOURCES);
        $entityName = $pick(self::ENTITY_NAMES);

        $environment = strtolower($environmentOption) === 'random'
            ? $pick(self::ENVIRONMENTS)
            : ($environmentOption !== '' ? $environmentOption : 'production');

        $message = $this->syntheticSentence($iteration, $rng);
        $trackingId = (string) Str::ulid();

        $start = CarbonImmutable::now()->subDays($daysRange)->startOfDay()->timestamp;
        $end = CarbonImmutable::now()->endOfDay()->timestamp;
        $receivedAt = CarbonImmutable::createFromTimestampUTC($start + (($rng()) % max(1, $end - $start + 1)))->toIso8601String();

        $hasException = ($rng() % 100) < 35;
        $exception = $hasException
            ? [
                'class' => $pick(self::EXCEPTION_CLASSES),
                'message' => $this->syntheticSentence($iteration ^ 0x9E3779B9, $rng),
                'file' => '/var/www/app/ExampleService.php',
                'line' => 1 + (($rng()) % 300),
                'stack_trace' => $this->syntheticParagraph($rng, 380),
            ]
            : null;

        $userId = ($rng() % 100) < 60 ? (string) (1 + (($rng()) % 500)) : null;
        $ip = ($rng() % 100) < 70 ? $this->syntheticIpv4($rng) : null;

        return [
            'tracking_id' => $trackingId,
            'level' => $level,
            'message' => $message,
            'message_search' => $message,
            'context' => [
                'bulk_seed' => true,
                'iteration' => $iteration,
                'request_id' => 'req-'.Str::ulid()->toString(),
            ],
            'entity_name' => $entityName,
            'entity_id' => (string) (1 + (($rng()) % 1000)),
            'source' => $source,
            'environment' => $environment,
            'channel' => $channel,
            'request_id' => 'req-'.Str::ulid()->toString(),
            'trace_id' => 'trace-'.Str::ulid()->toString(),
            'user_id' => $userId,
            'ip_address' => $ip,
            'user_agent' => $pick(self::USER_AGENTS),
            'exception' => $exception,
            'received_at' => $receivedAt,
        ];
    }

    /**
     * @param  \Closure(): int  $rng
     */
    private function syntheticSentence(int $salt, \Closure $rng): string
    {
        $n = 6 + (($rng() ^ $salt) % 7);
        $parts = [];
        for ($k = 0; $k < $n; $k++) {
            $parts[] = self::VOCAB[($rng() + $salt + $k) % count(self::VOCAB)];
        }

        return ucfirst(implode(' ', $parts)).'.';
    }

    /**
     * @param  \Closure(): int  $rng
     */
    private function syntheticParagraph(\Closure $rng, int $maxLen): string
    {
        $out = '';
        while (strlen($out) < $maxLen) {
            $out .= $this->syntheticSentence($rng(), $rng).' ';
        }

        return substr($out, 0, $maxLen);
    }

    /**
     * @param  \Closure(): int  $rng
     */
    private function syntheticIpv4(\Closure $rng): string
    {
        return sprintf(
            '%d.%d.%d.%d',
            1 + (($rng()) % 223),
            ($rng()) % 256,
            ($rng()) % 256,
            1 + (($rng()) % 254)
        );
    }
}
