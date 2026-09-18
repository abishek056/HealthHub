<?php

namespace App\Http\Controllers\Api;

use App\Events\AmbulanceLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmbulanceController extends Controller
{
    /**
     * Format ambulance for frontend.
     */
    public static function formatAmbulance(Ambulance $ambulance): array
    {
        return [
            'id' => $ambulance->id,
            'hospital_id' => $ambulance->hospital_id,
            'driver_name' => $ambulance->driver_name,
            'vehicle_number' => $ambulance->vehicle_number,
            'phone' => $ambulance->phone,
            'driver_phone' => $ambulance->phone,
            'status' => $ambulance->is_available ? 'available' : ($ambulance->is_on_call ? 'on_call' : 'dispatched'),
            'is_available' => (bool) $ambulance->is_available,
            'is_on_call' => (bool) $ambulance->is_on_call,
            'latitude' => (float) $ambulance->latitude,
            'longitude' => (float) $ambulance->longitude,
            'location' => [
                'lat' => (float) $ambulance->latitude,
                'lng' => (float) $ambulance->longitude,
            ],
            'updated_at' => $ambulance->updated_at,
        ];
    }

    /**
     * List all ambulances for a hospital.
     */
    public function index(int|string $hospitalId): JsonResponse
    {
        $hospital = Hospital::find($hospitalId);
        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $ambulances = Ambulance::where('hospital_id', $hospitalId)
            ->get()
            ->map(fn (Ambulance $a) => self::formatAmbulance($a));

        return response()->json($ambulances);
    }

    /**
     * Get a specific ambulance.
     */
    public function show(int|string $hospitalId, int|string $ambulanceId): JsonResponse
    {
        $ambulance = Ambulance::where('hospital_id', $hospitalId)->find($ambulanceId);
        if (! $ambulance) {
            return response()->json(['message' => 'Ambulance not found.'], 404);
        }

        return response()->json(self::formatAmbulance($ambulance));
    }

    /**
     * Update ambulance details / status.
     */
    public function update(Request $request, int|string $hospitalId, int|string $ambulanceId): JsonResponse
    {
        $ambulance = Ambulance::where('hospital_id', $hospitalId)->find($ambulanceId);
        if (! $ambulance) {
            return response()->json(['message' => 'Ambulance not found.'], 404);
        }

        $validated = $request->validate([
            'driver_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'is_available' => 'sometimes|boolean',
            'is_on_call' => 'sometimes|boolean',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
        ]);

        $ambulance->update($validated);

        return response()->json([
            'message' => 'Ambulance updated successfully.',
            'ambulance' => self::formatAmbulance($ambulance),
        ]);
    }

    /**
     * Track / update ambulance location.
     */
    public function track(Request $request, int|string $hospitalId, int|string $ambulanceId): JsonResponse
    {
        $ambulance = Ambulance::where('hospital_id', $hospitalId)->find($ambulanceId);
        if (! $ambulance) {
            return response()->json(['message' => 'Ambulance not found.'], 404);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'is_available' => 'nullable|boolean',
            'is_on_call' => 'nullable|boolean',
        ]);

        $ambulance->update($validated);

        // 🔴 Broadcast live location to all connected clients
        try {
            broadcast(new AmbulanceLocationUpdated($ambulance))->toOthers();
        } catch (\Throwable) {
            // Fail gracefully if Reverb is not running
        }

        return response()->json([
            'message'   => 'Ambulance location updated successfully.',
            'ambulance' => self::formatAmbulance($ambulance),
        ]);
    }
}
