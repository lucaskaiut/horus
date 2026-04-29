<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Jobs\ProcessIncomingLogJob;

final class LogIngestJobDispatcher
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function dispatchLogIngest(array $payload): void
    {
        ProcessIncomingLogJob::dispatch($payload)->onQueue('logs');
    }
}
