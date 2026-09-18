<?php

namespace App\Http\Controllers\Api;

use App\Helpers\LocationHelper;
use App\Http\Controllers\Controller;
use App\Http\Resources\BloodBankResource;
use App\Models\BloodBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BloodBankController extends Controller
{
    /**
     * GET /api/blood-banks
     * List all blood-bank stock entries with optional filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'blood_group' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'radius'      => ['nullable', 'numeric', 'min:1', 'max:500'], // km
        ]);

        $query = BloodBank::with('hospital')
            ->when($request->blood_group, fn ($q) => $q->where('blood_group', $request->blood_group))
            ->when($request->filled(['latitude', 'longitude']), function ($q) use ($request) {
                $lat = (float) $request->latitude;
                $lon = (float) $request->longitude;
                $radius = (float) ($request->radius ?? 50);

                $distanceExpr = LocationHelper::haversineSelectRaw($lat, $lon, 'hospitals.latitude', 'hospitals.longitude');

                $q->join('hospitals', 'blood_banks.hospital_id', '=', 'hospitals.id')
                  ->selectRaw("blood_banks.*, {$distanceExpr} AS distance_km")
                  ->having('distance_km', '<=', $radius)
                  ->orderBy('distance_km');
            })
            ->orderBy('blood_group');

        return BloodBankResource::collection($query->get());
    }

    /**
     * GET /api/blood-banks/{id}
     * Show a single blood-bank record.
     */
    public function show(int $id): BloodBankResource
    {
        $bloodBank = BloodBank::with('hospital')->findOrFail($id);

        return new BloodBankResource($bloodBank);
    }

    /**
     * PUT /api/blood-banks/{id}
     * Update blood stock (hospital staff only, enforced via middleware).
     */
    public function update(Request $request, int $id): BloodBankResource
    {
        $bloodBank = BloodBank::findOrFail($id);

        $validated = $request->validate([
            'units_available' => ['required', 'integer', 'min:0'],
        ]);

        $bloodBank->update($validated);

        return new BloodBankResource($bloodBank->load('hospital'));
    }
}
