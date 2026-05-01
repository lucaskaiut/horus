<?php

namespace App\Modules\Logs\Domain\Services;

use App\Modules\Logs\Domain\Filters\DateRangeFilter;
use App\Modules\Logs\Domain\Filters\ExistsFilter;
use App\Modules\Logs\Domain\Filters\LogFilter;
use App\Modules\Logs\Domain\Filters\TermFilter;
use App\Modules\Logs\Domain\Filters\TextContainsFilter;

final class LogFilterRegistry
{
    /**
     * @return array<string, LogFilter>
     */
    public function filters(): array
    {
        return [
            // datas
            'received_at' => new DateRangeFilter('received_at'),
            'processed_at' => new DateRangeFilter('processed_at'),
            'created_at' => new DateRangeFilter('created_at'),

            // texto
            'message' => new TextContainsFilter(['message_search^2', 'message', 'exception.message']),

            // termos
            'tracking_id' => new TermFilter('tracking_id'),
            'level' => new TermFilter('level'),
            'channel' => new TermFilter('channel'),
            'source' => new TermFilter('source'),
            'environment' => new TermFilter('environment'),
            'entity_name' => new TermFilter('entity_name'),
            'entity_id' => new TermFilter('entity_id'),
            'request_id' => new TermFilter('request_id'),
            'trace_id' => new TermFilter('trace_id'),
            'user_id' => new TermFilter('user_id'),
            'ip_address' => new TermFilter('ip_address'),

            // erro / exceção
            'has_exception' => new ExistsFilter('exception'),
            'exception_class' => new TermFilter('exception.class'),
        ];
    }
}
