<?php

namespace App\Providers;

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
