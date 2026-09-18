<?php

namespace App\Services;

use App\Helpers\LocationHelper;
use App\Models\Hospital;
use Illuminate\Support\Collection;

class EmergencyService
{
    /**
     * Find all hospitals within $radius km of the given coordinates.
     * Eager-loads beds and ambulances.
     *
     * @param  float  $lat
     * @param  float  $lng
     * @param  float  $radius   Search radius in km (default 10)
     * @param  string|null  $bloodGroup  Optional: filter to hospitals that have this blood group in stock
     * @return \Illuminate\Support\Collection  Each hospital has distance_km, icu_beds_available, etc.
     */
    public function findHospitalsNearby(
        float $lat,
        float $lng,
        float $radius = 10,
        ?string $bloodGroup = null
    ): Collection {
        $distanceExpr = LocationHelper::haversineSelectRaw($lat, $lng);

        $hospitals = Hospital::with(['beds', 'ambulances'])
            ->where('is_active', true)
            ->selectRaw("hospitals.*, {$distanceExpr} AS distance_km")
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->when($bloodGroup, function ($q) use ($bloodGroup) {
                // Only return hospitals whose blood bank has stock of the requested group
                $q->whereHas('bloodBanks', fn ($b) =>
                    $b->where('blood_group', $bloodGroup)
                      ->where('units_available', '>', 0)
                );
            })
            ->get();

        return $hospitals->map(function (Hospital $hospital) {
            $icuBeds       = $hospital->beds->where('ward_type', 'ICU');
            $emergencyBeds = $hospital->beds->where('ward_type', 'Emergency');
            $generalBeds   = $hospital->beds->where('ward_type', 'General');

            $availableAmbulances = $hospital->ambulances
                ->where('status', 'available')
                ->values();

            return [
                'id'                       => $hospital->id,
                'name'                     => $hospital->name,
                'address'                  => $hospital->address,
                'phone'                    => $hospital->phone,
                'latitude'                 => $hospital->latitude,
                'longitude'                => $hospital->longitude,
                'distance_km'              => round((float) $hospital->distance_km, 2),
                'icu_beds_available'       => (int) $icuBeds->sum('available'),
                'icu_beds_total'           => (int) $icuBeds->sum('total'),
                'emergency_beds_available' => (int) $emergencyBeds->sum('available'),
                'general_beds_available'   => (int) $generalBeds->sum('available'),
                'ambulances_available'     => $availableAmbulances->count(),
                'nearest_ambulance'        => $availableAmbulances->first() ? [
                    'id'             => $availableAmbulances->first()->id,
                    'driver_name'    => $availableAmbulances->first()->driver_name,
                    'vehicle_number' => $availableAmbulances->first()->vehicle_number,
                    'phone'          => $availableAmbulances->first()->phone,
                ] : null,
                'google_maps_url'          => $this->buildGoogleMapsUrl($hospital->latitude, $hospital->longitude),
            ];
        });
    }

    /**
     * Proxy to LocationHelper so callers don't need to import two classes.
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        return LocationHelper::calculateDistance($lat1, $lon1, $lat2, $lon2);
    }

    /**
     * Build a Google Maps directions URL from a user location to a destination.
     */
    public function buildGoogleMapsUrl(?float $destLat, ?float $destLon, ?float $originLat = null, ?float $originLon = null): ?string
    {
        if ($destLat === null || $destLon === null) {
            return null;
        }

        $destination = "{$destLat},{$destLon}";

        if ($originLat !== null && $originLon !== null) {
            $origin = "{$originLat},{$originLon}";
            return "https://www.google.com/maps/dir/{$origin}/{$destination}";
        }

        return "https://www.google.com/maps/search/?api=1&query={$destination}";
    }
}
