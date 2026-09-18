<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminHospitalResource;
use App\Models\Ambulance;
use App\Models\Bed;
use App\Models\BloodDonor;
use App\Models\Hospital;
use App\Models\OpdQueue;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/stats
     * Aggregated statistics across all hospitals.
     */
    public function stats(): JsonResponse
    {
        $totalHospitals  = Hospital::count();
        $activeHospitals = Hospital::where('is_active', true)->count();

        $bedStats = Bed::selectRaw('
            SUM(total_beds)     AS total_beds,
            SUM(available_beds) AS available_beds
        ')->first();

        $totalBeds     = (int) ($bedStats->total_beds     ?? 0);
        $availableBeds = (int) ($bedStats->available_beds ?? 0);
        $occupiedBeds  = $totalBeds - $availableBeds;
        $occupancyPct  = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100, 1) : 0;

        $ambulanceStats = Ambulance::selectRaw('
            COUNT(*)               AS total,
            SUM(is_available = 1)  AS available,
            SUM(is_on_call = 1)    AS on_call
        ')->first();

        $opdStats = OpdQueue::selectRaw('
            COUNT(*)                    AS total_queues,
            SUM(current_token)          AS total_tokens_issued,
            ROUND(AVG(estimated_wait_mins), 1) AS avg_wait_time_mins
        ')->first();

        $userStats = User::selectRaw('
            COUNT(*)                           AS total_users,
            SUM(role = "hospital_staff")       AS staff,
            SUM(role = "hospital_admin")       AS admins,
            SUM(role = "patient")              AS patients
        ')->first();

        $donorCount = BloodDonor::where('is_available', true)->count();

        // Blood group distribution
        $bloodStock = DB::table('blood_banks')
            ->selectRaw('blood_group, SUM(units_available) AS total_units')
            ->groupBy('blood_group')
            ->orderBy('blood_group')
            ->get()
            ->keyBy('blood_group')
            ->map(fn ($r) => (int) $r->total_units);

        return response()->json([
            'hospitals' => [
                'total'  => $totalHospitals,
                'active' => $activeHospitals,
            ],
            'beds' => [
                'total'        => $totalBeds,
                'available'    => $availableBeds,
                'occupied'     => $occupiedBeds,
                'occupancy_pct' => $occupancyPct,
            ],
            'ambulances' => [
                'total'     => (int) ($ambulanceStats->total     ?? 0),
                'available' => (int) ($ambulanceStats->available ?? 0),
                'on_call'   => (int) ($ambulanceStats->on_call   ?? 0),
            ],
            'opd' => [
                'total_queues'       => (int) ($opdStats->total_queues       ?? 0),
                'total_tokens_issued' => (int) ($opdStats->total_tokens_issued ?? 0),
                'avg_wait_time_mins'  => (float) ($opdStats->avg_wait_time_mins ?? 0),
            ],
            'users' => [
                'total'    => (int) ($userStats->total_users ?? 0),
                'staff'    => (int) ($userStats->staff    ?? 0),
                'admins'   => (int) ($userStats->admins   ?? 0),
                'patients' => (int) ($userStats->patients ?? 0),
            ],
            'blood_donors' => [
                'active_donors' => $donorCount,
            ],
            'blood_stock' => $bloodStock,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/hospitals/occupancy
     * All hospitals ranked by bed occupancy percentage (highest first).
     */
    public function hospitalsByOccupancy(): JsonResponse
    {
        $hospitals = Hospital::with(['beds'])
            ->where('is_active', true)
            ->get()
            ->map(function ($hospital) {
                $total     = $hospital->beds->sum('total_beds');
                $available = $hospital->beds->sum('available_beds');
                $occupied  = $total - $available;
                $pct       = $total > 0 ? round(($occupied / $total) * 100, 1) : 0;

                return [
                    'id'            => $hospital->id,
                    'name'          => $hospital->name,
                    'city'          => $hospital->city,
                    'type'          => $hospital->type,
                    'total_beds'    => $total,
                    'available_beds' => $available,
                    'occupied_beds' => $occupied,
                    'occupancy_pct' => $pct,
                    'status'        => match (true) {
                        $pct >= 90 => 'critical',
                        $pct >= 70 => 'high',
                        $pct >= 40 => 'moderate',
                        default    => 'low',
                    },
                ];
            })
            ->sortByDesc('occupancy_pct')
            ->values();

        return response()->json(['data' => $hospitals]);
    }
}
