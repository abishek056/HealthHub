<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    /**
     * Format a Hospital model to match frontend requirements.
     */
    public static function formatHospital(Hospital $hospital): array
    {
        $services = [];
        $bedsSummary = [
            'icu' => ['total' => 0, 'available' => 0],
            'emergency' => ['total' => 0, 'available' => 0],
            'general' => ['total' => 0, 'available' => 0],
            'private' => ['total' => 0, 'available' => 0],
        ];

        if ($hospital->relationLoaded('beds')) {
            foreach ($hospital->beds as $bed) {
                $type = strtolower($bed->ward_type);
                $bedsSummary[$type] = [
                    'total' => (int) $bed->total_beds,
                    'available' => (int) $bed->available_beds,
                ];
                if (in_array($bed->ward_type, ['ICU', 'Emergency'], true)) {
                    $services[] = $bed->ward_type;
                }
            }
        }

        $bloodBankSummary = [];
        if ($hospital->relationLoaded('bloodBanks') && $hospital->bloodBanks->isNotEmpty()) {
            $services[] = 'Blood Bank';
            foreach ($hospital->bloodBanks as $bb) {
                $bloodBankSummary[$bb->blood_group] = (int) $bb->units_available;
            }
        }

        $opdSummary = [];
        if ($hospital->relationLoaded('opdQueues') && $hospital->opdQueues->isNotEmpty()) {
            foreach ($hospital->opdQueues as $opd) {
                $opdSummary[$opd->department] = (int) $opd->current_token;
                if (stripos($opd->department, 'maternity') !== false) {
                    $services[] = 'Maternity';
                }
            }
        }

        $ambulanceSummary = [];
        if ($hospital->relationLoaded('ambulances')) {
            foreach ($hospital->ambulances as $amb) {
                $ambulanceSummary[] = [
                    'id' => $amb->id,
                    'hospital_id' => $amb->hospital_id,
                    'driver_name' => $amb->driver_name,
                    'vehicle_number' => $amb->vehicle_number,
                    'phone' => $amb->phone,
                    'driver_phone' => $amb->phone,
                    'status' => $amb->is_available ? 'available' : ($amb->is_on_call ? 'on_call' : 'dispatched'),
                    'is_available' => (bool) $amb->is_available,
                    'is_on_call' => (bool) $amb->is_on_call,
                    'location' => [
                        'lat' => (float) ($amb->latitude ?? $hospital->latitude),
                        'lng' => (float) ($amb->longitude ?? $hospital->longitude),
                    ],
                ];
            }
        }

        $services = array_values(array_unique($services));
        if (empty($services)) {
            $services = ['Emergency', 'General Medicine'];
        }

        return [
            'id' => $hospital->id,
            'name' => $hospital->name,
            'address' => $hospital->address,
            'phone' => $hospital->phone,
            'email' => $hospital->email,
            'latitude' => (float) $hospital->latitude,
            'longitude' => (float) $hospital->longitude,
            'location' => [
                'lat' => (float) $hospital->latitude,
                'lng' => (float) $hospital->longitude,
            ],
            'services' => $services,
            'beds' => $bedsSummary,
            'blood_bank' => $bloodBankSummary,
            'opd_queue' => $opdSummary,
            'ambulances' => $ambulanceSummary,
            'is_active' => (bool) $hospital->is_active,
        ];
    }

    /**
     * Display a listing of active hospitals with optional search and service filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Hospital::query()
            ->with(['beds', 'ambulances', 'bloodBanks', 'opdQueues'])
            ->active();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($service = $request->input('service')) {
            if ($service === 'ICU' || $service === 'Emergency') {
                $query->whereHas('beds', function ($q) use ($service) {
                    $q->where('ward_type', $service);
                });
            } elseif ($service === 'Blood Bank') {
                $query->whereHas('bloodBanks');
            } elseif ($service === 'Maternity') {
                $query->whereHas('opdQueues', function ($q) {
                    $q->where('department', 'like', '%Maternity%');
                });
            }
        }

        $hospitals = $query->get()->map(fn (Hospital $h) => self::formatHospital($h));

        return response()->json($hospitals);
    }

    /**
     * Display the specified hospital.
     */
    public function show(int|string $id): JsonResponse
    {
        $hospital = Hospital::with(['beds', 'ambulances', 'bloodBanks', 'opdQueues'])->find($id);

        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        return response()->json(self::formatHospital($hospital));
    }

    /**
     * Store a newly created hospital (super_admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        $hospital = Hospital::create($validated);

        return response()->json([
            'message' => 'Hospital created successfully.',
            'hospital' => self::formatHospital($hospital->load(['beds', 'ambulances', 'bloodBanks', 'opdQueues'])),
        ], 201);
    }

    /**
     * Update the specified hospital (super_admin).
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $hospital = Hospital::find($id);

        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string',
            'phone' => 'sometimes|required|string|max:20',
            'email' => 'nullable|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        $hospital->update($validated);

        return response()->json([
            'message' => 'Hospital updated successfully.',
            'hospital' => self::formatHospital($hospital->fresh(['beds', 'ambulances', 'bloodBanks', 'opdQueues'])),
        ]);
    }

    /**
     * Remove the specified hospital (super_admin).
     */
    public function destroy(int|string $id): JsonResponse
    {
        $hospital = Hospital::find($id);

        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $hospital->delete();

        return response()->json(['message' => 'Hospital deleted successfully.']);
    }
}
