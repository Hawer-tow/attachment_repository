<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\HousekeepingTaskController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RateOverrideController;
use App\Http\Controllers\Api\RoomTypeController;
use App\Http\Controllers\Api\AboutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\MpesaController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (No Auth Required)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// About & Contact — publicly accessible
Route::get('/about',    [AboutController::class,  'index']);
Route::get('/contact',  [ContactController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);

// M-Pesa callback — must be public (Safaricom calls this directly)
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user',      [AuthController::class, 'user']);
    Route::post('/logout',   [AuthController::class, 'logout']);

    // M-Pesa STK Push — auth required to initiate payment
    Route::post('/mpesa/initiate', [MpesaController::class, 'initiate']);

    /*
    |----------------------------------------------------------------------
    | Admin + Staff Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin,staff')->group(function () {

        // Rooms & Room Types (read only for staff)
        Route::apiResource('rooms',      RoomController::class)->only(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->only(['index', 'show']);

        // Full CRUD
        Route::apiResource('guests',             GuestController::class);
        Route::apiResource('bookings',           BookingController::class);
        Route::apiResource('housekeeping-tasks', HousekeepingTaskController::class);
        Route::apiResource('payments',           PaymentController::class);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Booking Actions
        Route::get('/available-rooms',            [BookingController::class, 'availableRooms']);
        Route::get('/booking-calendar',           [BookingController::class, 'calendar']);
        Route::get('/bookings/{id}/invoice',      [BookingController::class, 'invoice']);
        Route::post('/bookings/{id}/check-in',    [BookingController::class, 'checkIn']);
        Route::post('/bookings/{id}/check-out',   [BookingController::class, 'checkOut']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin Only Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {

        // Rooms & Room Types (write for admin)
        Route::apiResource('rooms',      RoomController::class)->except(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->except(['index', 'show']);

        // Rate Overrides
        Route::apiResource('rate-overrides', RateOverrideController::class);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/revenue',          [ReportController::class, 'revenue']);
            Route::get('/bookings',         [ReportController::class, 'bookings']);
            Route::get('/occupancy',        [ReportController::class, 'occupancy']);
            Route::get('/monthly-revenue',  [ReportController::class, 'monthlyRevenue']);
            Route::get('/monthly-bookings', [ReportController::class, 'monthlyBookings']);
        });
    });
});
