<?php

namespace App\Modules\Logs\Domain\ValueObjects;

final readonly class TokenValidationResult
{
    /**
     * @param  list<string>  $scopes
     */
    private function __construct(
        public bool $valid,
        public array $scopes,
        public ?string $clientId,
        public ?string $clientName,
    ) {}

    public static function invalid(): self
    {
        return new self(false, [], null, null);
    }

    /**
     * @param  array<string, mixed>  $json
     */
    public static function fromAuthServerPayload(array $json): self
    {
        $valid = filter_var($json['valid'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $scopesRaw = $json['scopes'] ?? [];
        $scopes = is_array($scopesRaw)
            ? array_values(array_filter(array_map('strval', $scopesRaw)))
            : [];
        $client = $json['client'] ?? [];
        $clientId = isset($client['id']) ? (string) $client['id'] : null;
        $clientName = isset($client['name']) ? (string) $client['name'] : null;

        return new self($valid, $scopes, $clientId, $clientName);
    }

    public function isValid(): bool
    {
        return $this->valid;
    }

    public function hasScope(string $scope): bool
    {
        return in_array($scope, $this->scopes, true);
    }
}
