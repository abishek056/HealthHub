<?php

use App\Http\Controllers\Api\AmbulanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BedController;
use App\Http\Controllers\Api\BloodBankController;
use App\Http\Controllers\Api\BloodDonorController;
use App\Http\Controllers\Api\EmergencyController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\OPDQueueController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\HospitalManagementController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    // Public
    Route::post('/login', [AuthController::class, 'login'])->name('login');

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
| Public Hospital Routes (no auth required)
|--------------------------------------------------------------------------
|
| GET /api/hospitals                  - list all hospitals
| GET /api/hospitals/{id}             - show hospital details
| GET /api/hospitals/{id}/beds        - show bed availability
| GET /api/hospitals/{id}/ambulances  - show ambulance locations
| GET /api/hospitals/{id}/opd         - show OPD queue status
*/

Route::get('/hospitals', [HospitalController::class, 'index']);
Route::get('/hospitals/{id}', [HospitalController::class, 'show']);

Route::get('/hospitals/{id}/beds', [BedController::class, 'index']);
Route::get('/hospitals/{id}/beds/{bedId}', [BedController::class, 'show']);

Route::get('/hospitals/{id}/ambulances', [AmbulanceController::class, 'index']);
Route::get('/hospitals/{id}/ambulances/{ambulanceId}', [AmbulanceController::class, 'show']);

Route::get('/hospitals/{id}/opd', [OPDQueueController::class, 'index']);
Route::get('/hospitals/{id}/opd/{queueId}', [OPDQueueController::class, 'show']);
Route::post('/hospitals/{id}/opd/book', [OPDQueueController::class, 'bookToken']);

/*
|--------------------------------------------------------------------------
| Public Blood Bank & Donor Routes (no auth required)
|--------------------------------------------------------------------------
|
| GET  /api/blood-banks                  - list all blood banks (filter: blood_group, lat, lon)
| GET  /api/blood-banks/{id}             - show blood bank details
| GET  /api/blood-donors                 - list active donors (filter: blood_group, lat, lon)
| GET  /api/blood-donors/{id}            - show donor profile
| POST /api/blood-donors                 - register as donor
| POST /api/blood-donors/request         - request blood from nearest eligible donors
*/

Route::get('/blood-banks', [BloodBankController::class, 'index']);
Route::get('/blood-banks/{id}', [BloodBankController::class, 'show']);

Route::get('/blood-donors', [BloodDonorController::class, 'index']);
Route::get('/blood-donors/{id}', [BloodDonorController::class, 'show']);
Route::post('/blood-donors', [BloodDonorController::class, 'store']);
Route::post('/blood-donors/request', [BloodDonorController::class, 'requestDonor']);

/*
|--------------------------------------------------------------------------
| Emergency Routes (public — no auth required)
|--------------------------------------------------------------------------
|
| GET /api/emergency/find-nearest-hospital
|   Params: latitude, longitude, blood_group (optional), radius (optional, km)
|   Returns nearest hospital with ICU beds + up to 4 alternatives
*/

Route::prefix('emergency')->group(function () {
    Route::get('/find-nearest-hospital', [EmergencyController::class, 'findNearestHospital']);
});

/*
|--------------------------------------------------------------------------
| Protected routes (hospital_staff only + tenant isolation)
|--------------------------------------------------------------------------
|
| PUT  /api/hospitals/{id}/beds/{bedId}              - update bed availability
| PUT  /api/hospitals/{id}/ambulances/{id}           - update ambulance
| PUT  /api/hospitals/{id}/ambulances/{id}/track     - update ambulance location
| PUT  /api/hospitals/{id}/opd                       - update OPD queue
| POST /api/hospitals/{id}/opd/book                  - book OPD token
*/

Route::middleware(['auth:sanctum', 'role:hospital_staff,hospital_admin,super_admin', 'tenant'])
    ->group(function () {

        // Beds
        Route::put('/hospitals/{id}/beds/{bedId}', [BedController::class, 'update']);

        // Ambulances
        Route::put('/hospitals/{id}/ambulances/{ambulanceId}', [AmbulanceController::class, 'update']);
        Route::put('/hospitals/{id}/ambulances/{ambulanceId}/track', [AmbulanceController::class, 'track']);

        // OPD
        Route::put('/hospitals/{id}/opd', [OPDQueueController::class, 'update']);

        // Blood Bank stock update
        Route::put('/blood-banks/{id}', [BloodBankController::class, 'update']);
    });

/*
|--------------------------------------------------------------------------
| Protected routes (super_admin only)
|--------------------------------------------------------------------------
|
| POST   /api/hospitals      - create hospital
| PUT    /api/hospitals/{id} - update hospital
| DELETE /api/hospitals/{id} - delete hospital
*/

Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::post('/hospitals', [HospitalController::class, 'store']);
    Route::put('/hospitals/{id}', [HospitalController::class, 'update']);
    Route::delete('/hospitals/{id}', [HospitalController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Super Admin Panel Routes  —  /api/admin/*
|--------------------------------------------------------------------------
|
| GET  /api/admin/stats                    - aggregated dashboard stats
| GET  /api/admin/hospitals/occupancy      - hospitals by bed occupancy
| GET  /api/admin/hospitals                - list all hospitals
| POST /api/admin/hospitals                - create hospital
| GET  /api/admin/hospitals/{id}           - show hospital details
| PUT  /api/admin/hospitals/{id}           - update hospital
| DELETE /api/admin/hospitals/{id}         - delete hospital
| GET  /api/admin/users                    - list all users
| POST /api/admin/users                    - create user
| GET  /api/admin/users/{id}              - show user
| PUT  /api/admin/users/{id}              - update user
| DELETE /api/admin/users/{id}            - delete user
*/

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {

        // Dashboard
        Route::get('/stats',                   [DashboardController::class, 'stats']);
        Route::get('/hospitals/occupancy',     [DashboardController::class, 'hospitalsByOccupancy']);

        // Hospital management
        Route::get('/hospitals',               [HospitalManagementController::class, 'index']);
        Route::post('/hospitals',              [HospitalManagementController::class, 'store']);
        Route::get('/hospitals/{id}',          [HospitalManagementController::class, 'show']);
        Route::put('/hospitals/{id}',          [HospitalManagementController::class, 'update']);
        Route::delete('/hospitals/{id}',       [HospitalManagementController::class, 'destroy']);

        // User management
        Route::get('/users',                   [UserManagementController::class, 'index']);
        Route::post('/users',                  [UserManagementController::class, 'store']);
        Route::get('/users/{id}',              [UserManagementController::class, 'show']);
        Route::put('/users/{id}',              [UserManagementController::class, 'update']);
        Route::delete('/users/{id}',           [UserManagementController::class, 'destroy']);
    });