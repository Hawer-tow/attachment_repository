<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomStatusLogController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\HousekeepingTaskController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RateOverrideController;
use App\Http\Controllers\Api\RoomServiceOrderStaffController;
use App\Http\Controllers\Api\RoomTypeController;
use App\Http\Controllers\Api\AboutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\Portal\ServiceRequestController as PortalServiceRequestController;
use App\Http\Controllers\Api\Portal\LoyaltyController as PortalLoyaltyController;
use App\Http\Controllers\Api\ServiceRequestStaffController;
use App\Http\Controllers\Api\AiController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (No Auth Required)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login',    [AuthController::class, 'login'])->name('login');

Route::get('/about',    [AboutController::class,  'index']);
Route::get('/contact',  [ContactController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);

Route::post('/mpesa/callback', [MpesaController::class, 'callback']);

Route::prefix('portal')->group(function () {
    Route::get('room-types',            [PortalController::class, 'getRoomTypes']);
    Route::get('available-rooms',       [PortalController::class, 'getAvailableRooms']);
    Route::post('bookings',             [PortalController::class, 'createBooking']);
    Route::get('bookings/lookup',       [PortalController::class, 'lookupBooking']);
    Route::post('bookings/{id}/cancel', [PortalController::class, 'cancelBooking']);
    Route::get('bookings/{id}/invoice', [PortalController::class, 'invoice']);
    Route::post('pay',                  [PortalController::class, 'stkPush']);
    Route::post('service-requests',     [PortalServiceRequestController::class, 'store']);
    Route::get('loyalty',               [PortalLoyaltyController::class, 'show']);

    Route::get('room-service/menu',                     [PortalController::class, 'roomServiceMenu']);
    Route::post('room-service/orders',                  [PortalController::class, 'createRoomServiceOrder']);
    Route::get('room-service/orders/lookup',            [PortalController::class, 'lookupRoomServiceOrder']);
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user',    [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/mpesa/initiate', [MpesaController::class, 'initiate']);

    /*
    |--------------------------------------------------------------------------
    | AI Routes (Role Restricted)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,manager,receptionist,housekeeper')->group(function () {
        Route::get('ai/faqs', [AiController::class, 'faqs']);
        Route::post('ai/query', [AiController::class, 'query']);
        Route::get('ai/interactions', [AiController::class, 'interactions']);
        Route::post('ai/interactions', [AiController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin + Staff Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,staff')->group(function () {
        Route::apiResource('rooms',      RoomController::class)->only(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->only(['index', 'show']);

        Route::apiResource('guests',             GuestController::class);
        Route::apiResource('bookings',           BookingController::class);
        Route::apiResource('housekeeping-tasks', HousekeepingTaskController::class);
        Route::apiResource('payments',           PaymentController::class);

        Route::get('service-requests',            [ServiceRequestStaffController::class, 'index']);
        Route::patch('service-requests/{id}',     [ServiceRequestStaffController::class, 'update']);

        Route::get('room-service-orders',         [RoomServiceOrderStaffController::class, 'index']);
        Route::patch('room-service-orders/{id}',  [RoomServiceOrderStaffController::class, 'update']);

        Route::get('room-status-logs', [RoomStatusLogController::class, 'index']);

        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/search', [SearchController::class, 'index']);

        Route::get('/available-rooms',         [BookingController::class, 'availableRooms']);
        Route::get('/booking-calendar',        [BookingController::class, 'calendar']);
        Route::get('/bookings/{id}/invoice',   [BookingController::class, 'invoice']);
        Route::post('/bookings/{id}/check-in', [BookingController::class, 'checkIn']);
        Route::post('/bookings/{id}/check-out',[BookingController::class, 'checkOut']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('rooms',      RoomController::class)->except(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->except(['index', 'show']);
        Route::apiResource('rate-overrides', RateOverrideController::class);

        Route::prefix('reports')->group(function () {
            Route::get('/revenue',          [ReportController::class, 'revenue']);
            Route::get('/bookings',         [ReportController::class, 'bookings']);
            Route::get('/occupancy',        [ReportController::class, 'occupancy']);
            Route::get('/monthly-revenue',  [ReportController::class, 'monthlyRevenue']);
            Route::get('/monthly-bookings', [ReportController::class, 'monthlyBookings']);
            Route::get('/pdf',              [ReportController::class, 'pdf']);
        });

        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
    });
});
