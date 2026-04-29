<?php

namespace App\Modules\Logs\Domain\Services;

use Illuminate\Support\Str;

final class TrackingIdGenerator
{
    public function generateTrackingId(): string
    {
        return Str::ulid()->toString();
    }
}
