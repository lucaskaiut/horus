<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Logs\Http\Controllers\LogController;
use Illuminate\Support\Facades\Route;

Route::post('/login', AuthController::class.'@login');
Route::post('/me', AuthController::class.'@me');
Route::get('/logs', LogController::class.'@index')->middleware('throttle:120,1');
Route::post('/logs', LogController::class.'@store')->middleware('throttle:60,1');
