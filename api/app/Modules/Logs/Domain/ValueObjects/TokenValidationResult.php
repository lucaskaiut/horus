<?php

namespace App\Modules\Logs\Domain\ValueObjects;

final readonly class TokenValidationResult
{
    private function __construct(
        public bool $valid,
        public ?string $clientId,
        public ?string $clientName,
        public ?string $clientEmail,
    ) {}

    public static function invalid(): self
    {
        return new self(false, null, null, null);
    }

    public static function valid(?string $clientId = null, ?string $clientName = null, ?string $clientEmail = null): self
    {
        return new self(true, $clientId, $clientName, $clientEmail);
    }

    public function isValid(): bool
    {
        return $this->valid;
    }
}
