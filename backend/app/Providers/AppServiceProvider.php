<?php

namespace App\Providers;

use App\Models\Room;
use App\Observers\RoomObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Room::observe(RoomObserver::class);
    }
}
