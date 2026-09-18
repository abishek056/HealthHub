<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BedController extends Controller
{
    /**
     * Get all beds and bed summary for a hospital.
     */
    public function index(int|string $hospitalId): JsonResponse
    {
        $hospital = Hospital::find($hospitalId);
        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $beds = Bed::where('hospital_id', $hospitalId)->get();

        $summary = [
            'hospital_id' => (int) $hospitalId,
            'icu' => ['total' => 0, 'available' => 0],
            'emergency' => ['total' => 0, 'available' => 0],
            'general' => ['total' => 0, 'available' => 0],
            'private' => ['total' => 0, 'available' => 0],
        ];

        foreach ($beds as $bed) {
            $key = strtolower($bed->ward_type);
            $summary[$key] = [
                'total' => (int) $bed->total_beds,
                'available' => (int) $bed->available_beds,
                'last_updated' => $bed->last_updated,
            ];
        }

        $summary['wards'] = $beds;

        return response()->json($summary);
    }

    /**
     * Get a specific bed record.
     */
    public function show(int|string $hospitalId, int|string $bedId): JsonResponse
    {
        $bed = Bed::where('hospital_id', $hospitalId)->find($bedId);
        if (! $bed) {
            return response()->json(['message' => 'Bed record not found.'], 404);
        }

        return response()->json($bed);
    }

    /**
     * Update bed availability (hospital staff / admin).
     */
    public function update(Request $request, int|string $hospitalId, int|string $bedId): JsonResponse
    {
        $bed = Bed::where('hospital_id', $hospitalId)->find($bedId);
        if (! $bed) {
            return response()->json(['message' => 'Bed record not found.'], 404);
        }

        $validated = $request->validate([
            'available_beds' => 'required|integer|min:0|lte:total_beds',
            'total_beds' => 'nullable|integer|min:0',
        ]);

        if (isset($validated['total_beds'])) {
            $bed->total_beds = $validated['total_beds'];
        }
        $bed->available_beds = $validated['available_beds'];
        $bed->last_updated = now();
        $bed->save();

        return response()->json([
            'message' => 'Bed availability updated successfully.',
            'bed' => $bed,
        ]);
    }
}
