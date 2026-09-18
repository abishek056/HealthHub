<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmergencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmergencyController extends Controller
{
    public function __construct(private EmergencyService $emergencyService) {}

    /**
     * GET /api/emergency/find-nearest-hospital
     *
     * Find the nearest hospital with available ICU / emergency beds.
     *
     * Query params:
     *   latitude    (required) float
     *   longitude   (required) float
     *   blood_group (optional) string  e.g. "O+"
     *   radius      (optional) float   km, default 10
     */
    public function findNearestHospital(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude'    => ['required', 'numeric', 'between:-90,90'],
            'longitude'   => ['required', 'numeric', 'between:-180,180'],
            'blood_group' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'radius'      => ['nullable', 'numeric', 'min:1', 'max:100'],
        ]);

        $lat        = (float) $validated['latitude'];
        $lon        = (float) $validated['longitude'];
        $bloodGroup = $validated['blood_group'] ?? null;
        $radius     = (float) ($validated['radius'] ?? 10);

        // ── 1. Find all hospitals within radius ────────────────────────────
        $hospitals = $this->emergencyService->findHospitalsNearby($lat, $lon, $radius, $bloodGroup);

        if ($hospitals->isEmpty()) {
            // Widen search to 50 km before giving up
            $hospitals = $this->emergencyService->findHospitalsNearby($lat, $lon, 50, $bloodGroup);

            if ($hospitals->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hospitals found within 50 km. Please call 102 for emergency assistance.',
                    'ambulance_contact' => '102',
                ], 404);
            }
        }

        // ── 2. Prefer hospitals that have ICU beds available ───────────────
        $withIcu    = $hospitals->filter(fn ($h) => $h['icu_beds_available'] > 0);
        $withAnyBed = $hospitals->filter(fn ($h) =>
            $h['emergency_beds_available'] > 0 || $h['general_beds_available'] > 0
        );

        // Pick the nearest hospital that has ICU first, then any bed, then just nearest
        $primary = $withIcu->first()
            ?? $withAnyBed->first()
            ?? $hospitals->first();

        // ── 3. Build alternatives list (exclude the primary) ──────────────
        $alternatives = $hospitals
            ->filter(fn ($h) => $h['id'] !== $primary['id'])
            ->take(4)
            ->map(fn ($h) => [
                'id'                   => $h['id'],
                'name'                 => $h['name'],
                'address'              => $h['address'],
                'phone'                => $h['phone'],
                'distance_km'          => $h['distance_km'],
                'icu_beds_available'   => $h['icu_beds_available'],
                'emergency_beds_available' => $h['emergency_beds_available'],
                'google_maps_url'      => $h['google_maps_url'],
            ])
            ->values();

        // ── 4. Directions URL for primary (from user's location) ──────────
        $directionsUrl = $this->emergencyService->buildGoogleMapsUrl(
            $primary['latitude'], $primary['longitude'],
            $lat, $lon
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'hospital' => array_merge($primary, [
                    'google_maps_directions' => $directionsUrl,
                ]),
                'ambulance_contact'     => '102',
                'alternative_hospitals' => $alternatives,
                'search_radius_km'      => $radius,
                'total_found'           => $hospitals->count(),
            ],
        ]);
    }
}
