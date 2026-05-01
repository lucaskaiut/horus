<?php

namespace App\Modules\Logs\Domain\Filters;

interface LogFilter
{
    /**
     * @param  array<string, mixed>  $bool
     */
    public function apply(array &$bool, mixed $value): void;
}
