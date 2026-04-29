<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', AuthController::class.'@login');
Route::post('/me', AuthController::class.'@me');
