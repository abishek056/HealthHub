<?php

namespace App\Services;

use App\Models\BloodBank;
use App\Models\Hospital;

class HospitalInitializationService
{
    /**
     * Initialize only the blood bank stock for a newly registered hospital.
     * Beds, ambulances, and OPD queues are NOT seeded automatically — the hospital
     * admin must add them manually through the admin dashboard.
     *
     * The `initializeWithDefaults()` method is available via the
     * POST /api/admin/hospitals/{id}/initialize-defaults endpoint
     * if a super-admin ever wants to bulk-seed all resources for an existing hospital.
     */
    public function initialize(Hospital $hospital): array
    {
        $hospitalId = $hospital->id;

        // Seed all 8 blood groups with 0 units — admin updates actual stock
        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        foreach ($bloodGroups as $group) {
            BloodBank::firstOrCreate(
                ['hospital_id' => $hospitalId, 'blood_group' => $group],
                [
                    'units_available' => 0,
                    'last_updated'    => now(),
                ]
            );
        }

        return [
            'beds_count'        => $hospital->beds()->count(),
            'ambulances_count'  => $hospital->ambulances()->count(),
            'opd_queues_count'  => $hospital->opdQueues()->count(),
            'blood_banks_count' => $hospital->bloodBanks()->count(),
        ];
    }

    /**
     * Bulk-seed default beds, ambulances, and OPD queues for an existing hospital.
     * Called only from the super-admin "Initialize Defaults" endpoint.
     */
    public function initializeWithDefaults(Hospital $hospital): array
    {
        $hospitalId = $hospital->id;

        // Default Wards
        $defaultBeds = [
            ['ward_type' => 'Emergency', 'total_beds' => 12, 'available_beds' => 8],
            ['ward_type' => 'ICU',       'total_beds' => 6,  'available_beds' => 4],
            ['ward_type' => 'General',   'total_beds' => 40, 'available_beds' => 28],
            ['ward_type' => 'Private',   'total_beds' => 10, 'available_beds' => 7],
        ];

        foreach ($defaultBeds as $bedData) {
            \App\Models\Bed::firstOrCreate(
                ['hospital_id' => $hospitalId, 'ward_type' => $bedData['ward_type']],
                [
                    'total_beds'     => $bedData['total_beds'],
                    'available_beds' => $bedData['available_beds'],
                    'last_updated'   => now(),
                ]
            );
        }

        // Default Ambulances
        if ($hospital->ambulances()->count() === 0) {
            $lat = $hospital->latitude ?? 27.7056;
            $lng = $hospital->longitude ?? 85.3131;

            \App\Models\Ambulance::create([
                'hospital_id'    => $hospitalId,
                'driver_name'    => 'Driver A',
                'vehicle_number' => 'BA-1-JHA-' . rand(1000, 9999),
                'phone'          => '9801' . rand(100000, 999999),
                'latitude'       => $lat,
                'longitude'      => $lng,
                'is_available'   => true,
                'is_on_call'     => false,
            ]);
        }

        // Default OPD Queues
        $defaultOpd = [
            ['department' => 'General Medicine',   'current_token' => 1, 'estimated_wait_mins' => 15, 'crowd_level' => 'low'],
            ['department' => 'Emergency / Trauma', 'current_token' => 1, 'estimated_wait_mins' => 5,  'crowd_level' => 'low'],
        ];

        foreach ($defaultOpd as $opdData) {
            \App\Models\OpdQueue::firstOrCreate(
                ['hospital_id' => $hospitalId, 'department' => $opdData['department']],
                [
                    'current_token'       => $opdData['current_token'],
                    'estimated_wait_mins' => $opdData['estimated_wait_mins'],
                    'crowd_level'         => $opdData['crowd_level'],
                    'last_updated'        => now(),
                ]
            );
        }

        // Blood Banks
        $this->initialize($hospital);

        return [
            'beds_count'        => $hospital->beds()->count(),
            'ambulances_count'  => $hospital->ambulances()->count(),
            'opd_queues_count'  => $hospital->opdQueues()->count(),
            'blood_banks_count' => $hospital->bloodBanks()->count(),
        ];
    }
}
