<?php

namespace App\Http\Controllers\Api;

use App\Helpers\LocationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterDonorRequest;
use App\Http\Resources\BloodDonorResource;
use App\Models\BloodDonor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BloodDonorController extends Controller
{
    /**
     * GET /api/blood-donors
     * List donors with optional filtering by blood group, location, and radius.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'blood_group' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'radius'      => ['nullable', 'numeric', 'min:1', 'max:500'],
        ]);

        $query = BloodDonor::query()
            ->where('is_active', true)
            ->when($request->blood_group, fn ($q) => $q->where('blood_group', $request->blood_group))
            ->when($request->filled(['latitude', 'longitude']), function ($q) use ($request) {
                $lat    = (float) $request->latitude;
                $lon    = (float) $request->longitude;
                $radius = (float) ($request->radius ?? 30);

                $distanceExpr = LocationHelper::haversineSelectRaw($lat, $lon);

                $q->selectRaw("*, {$distanceExpr} AS distance_km")
                  ->having('distance_km', '<=', $radius)
                  ->orderBy('distance_km');
            });

        $donors = $query->get();

        // Annotate eligibility on each model instance
        foreach ($donors as $donor) {
            $donor->eligible = LocationHelper::isDonorEligible($donor)['eligible'];
        }

        return BloodDonorResource::collection($donors);
    }

    /**
     * GET /api/blood-donors/{id}
     * Show a single donor's public profile.
     */
    public function show(int $id): BloodDonorResource
    {
        $donor = BloodDonor::findOrFail($id);
        $donor->eligible = LocationHelper::isDonorEligible($donor)['eligible'];

        return new BloodDonorResource($donor);
    }

    /**
     * POST /api/blood-donors
     * Register as a blood donor.
     */
    public function store(RegisterDonorRequest $request): JsonResponse
    {
        $donor = BloodDonor::create(array_merge(
            $request->validated(),
            ['user_id' => $request->user()?->id]
        ));

        return response()->json([
            'message' => 'Donor registered successfully.',
            'donor'   => new BloodDonorResource($donor),
        ], 201);
    }

    /**
     * POST /api/blood-donors/request
     * Request blood from the nearest eligible donors matching the required blood group.
     */
    public function requestDonor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'blood_group' => ['required', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'latitude'    => ['required', 'numeric', 'between:-90,90'],
            'longitude'   => ['required', 'numeric', 'between:-180,180'],
            'radius'      => ['nullable', 'numeric', 'min:1', 'max:200'],
            'units_needed' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $lat    = (float) $validated['latitude'];
        $lon    = (float) $validated['longitude'];
        $radius = (float) ($validated['radius'] ?? 25);

        $distanceExpr = LocationHelper::haversineSelectRaw($lat, $lon);

        $donors = BloodDonor::query()
            ->where('is_active', true)
            ->where('blood_group', $validated['blood_group'])
            ->selectRaw("*, {$distanceExpr} AS distance_km")
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->get();

        // Filter eligible donors
        $eligible = $donors->filter(
            fn ($d) => LocationHelper::isDonorEligible($d)['eligible']
        )->values();

        if ($eligible->isEmpty()) {
            return response()->json([
                'message' => 'No eligible donors found within the specified radius.',
                'donors'  => [],
            ], 200);
        }

        // Annotate and return
        foreach ($eligible as $donor) {
            $donor->eligible = true;
        }

        return response()->json([
            'message'       => "{$eligible->count()} eligible donor(s) found.",
            'blood_group'   => $validated['blood_group'],
            'search_radius' => $radius,
            'donors'        => BloodDonorResource::collection($eligible),
        ]);
    }
}
