<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Logs\Http\Controllers\LogController;
use App\Modules\Users\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', AuthController::class.'@login')->middleware('throttle:20,1');
Route::post('/me', AuthController::class.'@me')->middleware('auth:sanctum');
Route::post('/logout', AuthController::class.'@logout')->middleware('auth:sanctum');
Route::get('/logs', LogController::class.'@index')->middleware(['auth:sanctum', 'throttle:120,1']);
Route::get('/logs/summary', LogController::class.'@summary')->middleware(['auth:sanctum', 'throttle:120,1']);
Route::post('/logs', LogController::class.'@store')->middleware(['auth:sanctum', 'throttle:60,1']);

Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function (): void {
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});
