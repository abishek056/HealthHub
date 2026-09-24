<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class HospitalStaffController extends Controller
{
    /**
     * List all staff members for a specific hospital.
     */
    public function index(int|string $hospitalId, Request $request): JsonResponse
    {
        $hospital = Hospital::findOrFail($hospitalId);

        $staff = User::where('hospital_id', $hospital->id)
            ->whereIn('role', ['hospital_staff', 'hospital_admin'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->search;
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->latest('id')
            ->get(['id', 'hospital_id', 'name', 'email', 'phone', 'role', 'created_at']);

        return response()->json([
            'success' => true,
            'hospital' => [
                'id' => $hospital->id,
                'name' => $hospital->name,
            ],
            'data' => $staff,
        ]);
    }

    /**
     * Add a new staff member to the hospital.
     */
    public function store(int|string $hospitalId, Request $request): JsonResponse
    {
        $hospital = Hospital::findOrFail($hospitalId);
        $actingUser = $request->user();

        // hospital_staff users can only create other hospital_staff (not hospital_admin)
        $isActingStaff = $actingUser && $actingUser->role === 'hospital_staff';

        $validated = $request->validate([
            'name'     => 'required|string|min:2|max:100',
            'email'    => 'required|email|unique:users,email|max:150',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string|max:25',
            'role'     => 'nullable|in:hospital_staff,hospital_admin',
        ]);

        // Privilege escalation guard: staff cannot create admins
        $assignedRole = $validated['role'] ?? 'hospital_staff';
        if ($isActingStaff && $assignedRole === 'hospital_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Hospital staff members can only add other hospital staff, not administrators.',
            ], 403);
        }

        $staff = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'role'        => $assignedRole,
            'hospital_id' => $hospital->id,
            'phone'       => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Hospital staff added successfully.',
            'data'    => [
                'id'          => $staff->id,
                'hospital_id' => $staff->hospital_id,
                'name'        => $staff->name,
                'email'       => $staff->email,
                'phone'       => $staff->phone,
                'role'        => $staff->role,
                'created_at'  => $staff->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Update an existing hospital staff member.
     */
    public function update(int|string $hospitalId, int $userId, Request $request): JsonResponse
    {
        $hospital = Hospital::findOrFail($hospitalId);
        $actingUser = $request->user();

        $staff = User::where('hospital_id', $hospital->id)
            ->where('id', $userId)
            ->firstOrFail();

        // hospital_staff cannot edit hospital_admin accounts
        $isActingStaff = $actingUser && $actingUser->role === 'hospital_staff';
        if ($isActingStaff && $staff->role === 'hospital_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Hospital staff cannot edit administrator accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|min:2|max:100',
            'email'    => ['required', 'email', 'max:150', Rule::unique('users')->ignore($staff->id)],
            'password' => 'nullable|string|min:6',
            'phone'    => 'nullable|string|max:25',
            'role'     => 'nullable|in:hospital_staff,hospital_admin',
        ]);

        // Privilege escalation guard: staff cannot promote anyone to hospital_admin
        $newRole = $validated['role'] ?? $staff->role;
        if ($isActingStaff && $newRole === 'hospital_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Hospital staff cannot assign the Hospital Admin role.',
            ], 403);
        }

        $updateData = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? $staff->phone,
            'role'  => $newRole,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $staff->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Staff details updated successfully.',
            'data'    => [
                'id'          => $staff->id,
                'hospital_id' => $staff->hospital_id,
                'name'        => $staff->name,
                'email'       => $staff->email,
                'phone'       => $staff->phone,
                'role'        => $staff->role,
                'updated_at'  => $staff->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Remove a staff member from the hospital.
     */
    public function destroy(int|string $hospitalId, int $userId, Request $request): JsonResponse
    {
        $hospital = Hospital::findOrFail($hospitalId);
        $actingUser = $request->user();

        $staff = User::where('hospital_id', $hospital->id)
            ->where('id', $userId)
            ->firstOrFail();

        if ($actingUser && $actingUser->id === $staff->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        // hospital_staff cannot delete hospital_admin accounts
        if ($actingUser && $actingUser->role === 'hospital_staff' && $staff->role === 'hospital_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Hospital staff cannot remove administrator accounts.',
            ], 403);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff member removed successfully.',
        ]);
    }
}
