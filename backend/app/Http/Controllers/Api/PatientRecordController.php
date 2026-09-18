<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRecordRequest;
use App\Http\Requests\UpdatePatientRecordRequest;
use App\Http\Resources\PatientRecordResource;
use App\Models\PatientRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PatientRecordController extends Controller
{
    /**
     * GET /api/patient-records
     * List all patient records for hospital staff (strictly scoped by hospital_id).
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $user = $request->user();

        // Non-super-admins must be assigned to a hospital
        if (! $user->isSuperAdmin() && $user->hospital_id === null) {
            return response()->json([
                'message' => 'Forbidden. Your account is not associated with any hospital.',
            ], 403);
        }

        $query = PatientRecord::with(['hospital', 'creator']);

        // Enforce tenant isolation
        if (! $user->isSuperAdmin()) {
            $query->where('hospital_id', $user->hospital_id);
        } elseif ($request->filled('hospital_id')) {
            // Super admin can optionally filter by a specific hospital
            $query->where('hospital_id', (int) $request->hospital_id);
        }

        // Search by patient name, phone, or diagnosis
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('patient_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('diagnosis', 'like', "%{$search}%");
            });
        }

        // Filter by gender if specified
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        $perPage = (int) $request->input('per_page', 15);
        $records = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return PatientRecordResource::collection($records);
    }

    /**
     * GET /api/patient-records/{id}
     * Show details of a specific patient record.
     */
    public function show(Request $request, int|string $id): PatientRecordResource|JsonResponse
    {
        $user = $request->user();
        $record = PatientRecord::with(['hospital', 'creator'])->findOrFail($id);

        // Tenant check: staff can only view records of their own hospital
        if (! $user->isSuperAdmin() && (int) $record->hospital_id !== (int) $user->hospital_id) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to access records belonging to another hospital.',
            ], 403);
        }

        return new PatientRecordResource($record);
    }

    /**
     * POST /api/patient-records
     * Create a new patient record.
     */
    public function store(StorePatientRecordRequest $request): JsonResponse
    {
        $user = $request->user();

        // Determine tenant hospital ID
        if ($user->isSuperAdmin()) {
            $hospitalId = $request->input('hospital_id') ?? $user->hospital_id;
            if (! $hospitalId) {
                return response()->json([
                    'message' => 'The hospital_id field is required for super administrators.',
                ], 422);
            }
        } else {
            if ($user->hospital_id === null) {
                return response()->json([
                    'message' => 'Forbidden. Your account is not associated with any hospital.',
                ], 403);
            }
            $hospitalId = $user->hospital_id;
        }

        $validated = $request->validated();
        $validated['hospital_id'] = $hospitalId;
        $validated['created_by']  = $user->id;

        $record = PatientRecord::create($validated);

        return response()->json([
            'message' => 'Patient record created successfully.',
            'data'    => new PatientRecordResource($record->load(['hospital', 'creator'])),
        ], 201);
    }

    /**
     * PUT /api/patient-records/{id}
     * Update an existing patient record.
     */
    public function update(UpdatePatientRecordRequest $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        $record = PatientRecord::findOrFail($id);

        // Tenant check: staff can only update records belonging to their own hospital
        if (! $user->isSuperAdmin() && (int) $record->hospital_id !== (int) $user->hospital_id) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to update records belonging to another hospital.',
            ], 403);
        }

        $validated = $request->validated();

        // Prevent modification of tenant ownership and author by hospital staff
        unset($validated['hospital_id'], $validated['created_by']);

        $record->update($validated);

        return response()->json([
            'message' => 'Patient record updated successfully.',
            'data'    => new PatientRecordResource($record->fresh()->load(['hospital', 'creator'])),
        ]);
    }

    /**
     * DELETE /api/patient-records/{id}
     * Delete a patient record.
     */
    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        $record = PatientRecord::findOrFail($id);

        // Tenant check: staff can only delete records belonging to their own hospital
        if (! $user->isSuperAdmin() && (int) $record->hospital_id !== (int) $user->hospital_id) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to delete records belonging to another hospital.',
            ], 403);
        }

        $record->delete();

        return response()->json([
            'message' => 'Patient record deleted successfully.',
        ]);
    }
}
