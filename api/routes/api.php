<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Logs\Http\Controllers\LogController;
use Illuminate\Support\Facades\Route;

Route::post('/login', AuthController::class.'@login');
Route::post('/register', AuthController::class.'@register');
Route::post('/me', AuthController::class.'@me')->middleware('auth:sanctum');
Route::post('/logout', AuthController::class.'@logout')->middleware('auth:sanctum');
Route::get('/logs', LogController::class.'@index')->middleware(['auth:sanctum', 'throttle:120,1']);
Route::post('/logs', LogController::class.'@store')->middleware(['auth:sanctum', 'throttle:60,1']);
