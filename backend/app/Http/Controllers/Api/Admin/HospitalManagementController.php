<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateHospitalRequest;
use App\Http\Requests\Admin\UpdateHospitalRequest;
use App\Http\Resources\Admin\AdminHospitalResource;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HospitalManagementController extends Controller
{
    /**
     * GET /api/admin/hospitals
     * List all hospitals with optional search + filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'search'    => ['nullable', 'string', 'max:100'],
            'city'      => ['nullable', 'string', 'max:100'],
            'type'      => ['nullable', 'string', 'in:government,private,trust,clinic'],
            'is_active' => ['nullable', 'boolean'],
            'per_page'  => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $hospitals = Hospital::with(['users', 'beds', 'ambulances'])
            ->when($request->search, fn ($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('address', 'like', "%{$request->search}%")
            )
            ->when($request->city,      fn ($q) => $q->where('city',      $request->city))
            ->when($request->type,      fn ($q) => $q->where('type',      $request->type))
            ->when($request->filled('is_active'), fn ($q) =>
                $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy('name')
            ->paginate($request->per_page ?? 20);

        return AdminHospitalResource::collection($hospitals);
    }

    /**
     * GET /api/admin/hospitals/{id}
     * Full hospital detail with all related data.
     */
    public function show(int $id): AdminHospitalResource
    {
        $hospital = Hospital::with([
            'users',
            'beds',
            'ambulances',
            'opdQueues',
            'bloodBanks',
        ])->findOrFail($id);

        // Compute occupancy
        $total     = $hospital->beds->sum('total');
        $available = $hospital->beds->sum('available');
        $hospital->occupancy_pct = $total > 0
            ? round((($total - $available) / $total) * 100, 1)
            : 0;

        return new AdminHospitalResource($hospital);
    }

    /**
     * POST /api/admin/hospitals
     * Create a new hospital and auto-initialize default resources (beds, fleet, opd, blood).
     */
    public function store(CreateHospitalRequest $request, \App\Services\HospitalInitializationService $initService): JsonResponse
    {
        $hospital = Hospital::create($request->validated());

        // Only seed blood bank slots (8 blood groups, 0 units each).
        // Beds, ambulances, and OPD queues must be added manually by the hospital admin.
        $initService->initialize($hospital);

        return response()->json([
            'message'  => 'Hospital created successfully. Please configure wards, ambulances, and OPD queues from the Hospital Admin dashboard.',
            'hospital' => new AdminHospitalResource($hospital->fresh(['beds', 'ambulances', 'opdQueues', 'bloodBanks'])),
        ], 201);
    }

    /**
     * POST /api/admin/hospitals/{id}/initialize-defaults
     * Initialize standard beds, ambulances, OPD queues, and blood banks.
     */
    public function initializeDefaults(int $id, \App\Services\HospitalInitializationService $initService): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);

        // Uses the bulk-seed method that also creates default beds, ambulances, and OPD queues.
        $counts = $initService->initializeWithDefaults($hospital);

        return response()->json([
            'message'  => 'Default beds, ambulances, and OPD queues initialized for this hospital.',
            'counts'   => $counts,
            'hospital' => new AdminHospitalResource($hospital->fresh(['beds', 'ambulances', 'opdQueues', 'bloodBanks'])),
        ]);
    }

    /**
     * PUT /api/admin/hospitals/{id}
     * Update an existing hospital.
     */
    public function update(UpdateHospitalRequest $request, int $id): AdminHospitalResource
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->update($request->validated());

        return new AdminHospitalResource($hospital->fresh(['users', 'beds', 'ambulances']));
    }

    /**
     * DELETE /api/admin/hospitals/{id}
     * Soft-delete (or hard-delete) a hospital.
     */
    public function destroy(int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);

        // Prevent deleting if it still has active staff
        if ($hospital->users()->where('is_active', true)->exists()) {
            return response()->json([
                'message' => 'Cannot delete a hospital with active staff. Deactivate staff first.',
            ], 422);
        }

        $hospital->delete();

        return response()->json(['message' => 'Hospital deleted successfully.']);
    }
}
