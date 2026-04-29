<?php

namespace App\Modules\Logs\Jobs;

use App\Modules\Logs\Domain\Services\ProcessIncomingLogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class ProcessIncomingLogJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly array $payload,
    ) {}

    public function handle(ProcessIncomingLogService $processIncomingLogService): void
    {
        $processIncomingLogService->process($this->payload);
    }
}
