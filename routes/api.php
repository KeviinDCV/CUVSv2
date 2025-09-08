<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JsonProcessorController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Test endpoint
Route::get('/test', function () {
    return response()->json(['status' => 'OK', 'message' => 'API is working']);
});

// JSON Processing Routes (sin middleware web para evitar CSRF)
Route::post('/process-json-sos', [JsonProcessorController::class, 'processJsonSOS']);
Route::get('/download-processed/{filename}', [JsonProcessorController::class, 'downloadProcessed']);
