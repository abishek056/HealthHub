<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    // Public
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Only super_admin can register new users
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('role:super_admin');
    });
});

/*
|--------------------------------------------------------------------------
| Hospital / Beds Routes (examples)
|--------------------------------------------------------------------------
|
| 1. GET  /api/hospitals/{id}/beds          → Public
| 2. PUT  /api/hospitals/{id}/beds/{bedId}  → Protected: hospital_staff + tenant isolation
| 3. GET  /api/admin/hospitals              → Protected: super_admin only
|
| Controllers are placeholders – replace with real controllers when ready.
*/

// Public: anyone can view beds for a hospital
Route::get('/hospitals/{id}/beds', function (int $id) {
    // Example – replace with BedController@index
    return response()->json([
        'message' => 'Public beds list for hospital ' . $id,
        'hospital_id' => $id,
    ]);
});

// Protected: hospital_staff can update a bed, but only for their own hospital
Route::put('/hospitals/{id}/beds/{bedId}', function (int $id, int $bedId) {
    // Example – replace with BedController@update
    return response()->json([
        'message' => 'Bed updated',
        'hospital_id' => $id,
        'bed_id' => $bedId,
    ]);
})->middleware(['auth:sanctum', 'role:hospital_staff', 'tenant']);

// Protected: only super_admin can list all hospitals (admin panel)
Route::get('/admin/hospitals', function () {
    // Example – replace with Admin\HospitalController@index
    return response()->json([
        'message' => 'All hospitals (super_admin only)',
    ]);
})->middleware(['auth:sanctum', 'role:super_admin']);