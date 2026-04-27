<?php

use Illuminate\Support\Facades\Route;

Route::post('/login', \App\Modules\Auth\Http\Controllers\AuthController::class.'@login');
