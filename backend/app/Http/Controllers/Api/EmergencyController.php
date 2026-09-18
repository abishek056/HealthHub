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
        $data = $request->all();
        // Decode + in query params (e.g. O+ can arrive as 'O ' or 'O' due to URL query decoding and TrimStrings middleware)
        if (isset($data['blood_group']) && is_string($data['blood_group'])) {
            $bg = trim(str_replace(' ', '+', $data['blood_group']));
            if (in_array($bg, ['A', 'B', 'AB', 'O'], true)) {
                $bg .= '+';
            }
            $data['blood_group'] = $bg;
        }

        $validated = validator($data, [
            'latitude'    => ['required', 'numeric', 'between:-90,90'],
            'longitude'   => ['required', 'numeric', 'between:-180,180'],
            'blood_group' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'radius'      => ['nullable', 'numeric', 'min:1', 'max:500'],
        ])->validate();

        $lat            = (float) $validated['latitude'];
        $lon            = (float) $validated['longitude'];
        $bloodGroup     = $validated['blood_group'] ?? null;
        $radius         = (float) ($validated['radius'] ?? 10);
        $bloodGroupNote = null;

        // ── 1. Find all hospitals within radius ────────────────────────────
        $hospitals = $this->emergencyService->findHospitalsNearby($lat, $lon, $radius, $bloodGroup);

        if ($hospitals->isEmpty()) {
            // Widen search to 50 km before giving up
            $hospitals = $this->emergencyService->findHospitalsNearby($lat, $lon, 50, $bloodGroup);

            if ($hospitals->isEmpty()) {
                // If still empty (e.g. testing from outside urban zones), widen to 500 km
                $hospitals = $this->emergencyService->findHospitalsNearby($lat, $lon, 500, $bloodGroup);
            }

            if ($hospitals->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hospitals found within emergency range. Please call 102 for emergency assistance.',
                    'ambulance_contact' => '102',
                ], 404);
            }
        }

        // ── 2. If blood group requested, reorder — put matching hospitals first ──
        $withBlood = collect();
        if ($bloodGroup) {
            $withBlood    = $hospitals->filter(fn ($h) => ($h['has_blood_group'] ?? false));
            $withoutBlood = $hospitals->reject(fn ($h) => ($h['has_blood_group'] ?? false));

            if ($withBlood->isNotEmpty()) {
                $hospitals = $withBlood->concat($withoutBlood)->values();
                $bloodGroupNote = "Found {$withBlood->count()} hospital(s) with {$bloodGroup} blood in stock (shown first).";
            } else {
                $bloodGroupNote = "No hospitals with {$bloodGroup} blood currently in stock. Showing nearest emergency facilities.";
            }
        }

        // ── 3. Prefer hospitals that have requested blood and/or ICU beds available ──
        if ($bloodGroup && $withBlood->isNotEmpty()) {
            $primary = $withBlood->first(fn ($h) => ($h['icu_beds_available'] ?? 0) > 0)
                ?? $withBlood->first(fn ($h) => (($h['emergency_beds_available'] ?? 0) > 0 || ($h['general_beds_available'] ?? 0) > 0))
                ?? $withBlood->first();
        } else {
            $withIcu    = $hospitals->filter(fn ($h) => ($h['icu_beds_available'] ?? 0) > 0);
            $withAnyBed = $hospitals->filter(fn ($h) =>
                ($h['emergency_beds_available'] ?? 0) > 0 || ($h['general_beds_available'] ?? 0) > 0
            );

            $primary = $withIcu->first()
                ?? $withAnyBed->first()
                ?? $hospitals->first();
        }

        // ── 4. Build alternatives list (exclude the primary) ──────────────
        $alternatives = $hospitals
            ->filter(fn ($h) => $h['id'] !== $primary['id'])
            ->take(4)
            ->map(fn ($h) => [
                'id'                       => $h['id'],
                'name'                     => $h['name'],
                'address'                  => $h['address'],
                'phone'                    => $h['phone'],
                'distance_km'              => $h['distance_km'],
                'icu_beds_available'       => $h['icu_beds_available'],
                'emergency_beds_available' => $h['emergency_beds_available'],
                'has_blood_group'          => $h['has_blood_group'] ?? false,
                'google_maps_url'          => $h['google_maps_url'],
                'latitude'                 => $h['latitude'],
                'longitude'                => $h['longitude'],
            ])
            ->values();

        // ── 5. Directions URL for primary (from user's location) ──────────
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
                'blood_group_note'      => $bloodGroupNote,
            ],
        ]);
    }
}
