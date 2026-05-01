<?php

namespace App\Providers;

use App\Modules\Auth\Domain\Contracts\LoginChannel;
use App\Modules\Auth\Domain\Services\LoginChannelRegistry;
use App\Modules\Auth\Infrastructure\Channels\InternalLoginChannel;
use App\Modules\Logs\Domain\Contracts\LogDocumentIndexer;
use App\Modules\Logs\Domain\Contracts\LogDocumentSearcher;
use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchLogDocumentIndexer;
use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchLogDocumentSearcher;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginChannelRegistry::class, function ($app) {
            /** @var iterable<int, LoginChannel> $channels */
            $channels = $app->tagged(LoginChannel::class);

            return new LoginChannelRegistry(iterator_to_array($channels));
        });

        $this->app->tag([
            InternalLoginChannel::class,
        ], LoginChannel::class);

        $this->app->bind(LogDocumentIndexer::class, OpenSearchLogDocumentIndexer::class);
        $this->app->bind(LogDocumentSearcher::class, OpenSearchLogDocumentSearcher::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
