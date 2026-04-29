<?php

namespace App\Providers;

use App\Modules\Logs\Domain\Contracts\LogDocumentIndexer;
use App\Modules\Logs\Infrastructure\OpenSearch\OpenSearchLogDocumentIndexer;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(LogDocumentIndexer::class, OpenSearchLogDocumentIndexer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
