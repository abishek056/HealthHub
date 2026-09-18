<?php

namespace App\Helpers;

class LocationHelper
{
    /**
     * Calculate the great-circle distance between two points on Earth
     * using the Haversine formula.
     *
     * @param  float  $lat1
     * @param  float  $lon1
     * @param  float  $lat2
     * @param  float  $lon2
     * @return float Distance in kilometres
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Determine whether a blood donor is eligible to donate today.
     *
     * @param  \App\Models\BloodDonor  $donor
     * @return array{eligible: bool, reason: string|null}
     */
    public static function isDonorEligible($donor): array
    {
        if (!$donor->is_active) {
            return ['eligible' => false, 'reason' => 'Donor is currently inactive.'];
        }

        $age = $donor->date_of_birth
            ? now()->diffInYears($donor->date_of_birth)
            : null;

        if ($age !== null && ($age < 18 || $age > 65)) {
            return ['eligible' => false, 'reason' => "Age {$age} is outside the eligible range (18–65)."];
        }

        if ($donor->weight !== null && $donor->weight < 50) {
            return ['eligible' => false, 'reason' => "Weight {$donor->weight} kg is below the minimum (50 kg)."];
        }

        if ($donor->last_donation_date) {
            $daysSince = now()->diffInDays($donor->last_donation_date);
            if ($daysSince < 90) {
                $remaining = 90 - $daysSince;
                return [
                    'eligible' => false,
                    'reason'   => "Last donation was {$daysSince} days ago. Must wait {$remaining} more day(s).",
                ];
            }
        }

        return ['eligible' => true, 'reason' => null];
    }

    /**
     * Build a raw SQL Haversine expression for use in Eloquent queries.
     *
     * @param  float   $lat
     * @param  float   $lon
     * @param  string  $latColumn
     * @param  string  $lonColumn
     * @return string  Raw SQL expression (distance in km)
     */
    public static function haversineSelectRaw(
        float $lat,
        float $lon,
        string $latColumn = 'latitude',
        string $lonColumn = 'longitude'
    ): string {
        return "(6371 * acos(
            cos(radians({$lat}))
            * cos(radians({$latColumn}))
            * cos(radians({$lonColumn}) - radians({$lon}))
            + sin(radians({$lat}))
            * sin(radians({$latColumn}))
        ))";
    }
}
