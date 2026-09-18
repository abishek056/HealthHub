<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserManagementController extends Controller
{
    /**
     * GET /api/admin/users
     * List all users with optional filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'role'        => ['nullable', 'string', 'in:super_admin,hospital_admin,hospital_staff,patient'],
            'hospital_id' => ['nullable', 'integer', 'exists:hospitals,id'],
            'search'      => ['nullable', 'string', 'max:100'],
            'is_active'   => ['nullable', 'boolean'],
            'per_page'    => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $users = User::with('hospital')
            ->when($request->role,        fn ($q) => $q->where('role',        $request->role))
            ->when($request->hospital_id, fn ($q) => $q->where('hospital_id', $request->hospital_id))
            ->when($request->search, fn ($q) =>
                $q->where('name',  'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            )
            ->when($request->filled('is_active'), fn ($q) =>
                $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy('name')
            ->paginate($request->per_page ?? 25);

        return AdminUserResource::collection($users);
    }

    /**
     * GET /api/admin/users/{id}
     * Show a single user with their associated hospital.
     */
    public function show(int $id): AdminUserResource
    {
        $user = User::with('hospital')->findOrFail($id);
        return new AdminUserResource($user);
    }

    /**
     * POST /api/admin/users
     * Create a new user (any role).
     */
    public function store(CreateUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => new AdminUserResource($user->load('hospital')),
        ], 201);
    }

    /**
     * PUT /api/admin/users/{id}
     * Update user details (role, hospital assignment, password reset, etc.).
     */
    public function update(UpdateUserRequest $request, int $id): AdminUserResource
    {
        $user      = User::findOrFail($id);
        $validated = $request->validated();

        // Only hash password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return new AdminUserResource($user->fresh('hospital'));
    }

    /**
     * DELETE /api/admin/users/{id}
     * Delete a user. Cannot delete yourself.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->role === 'super_admin') {
            $remaining = User::where('role', 'super_admin')->where('id', '!=', $id)->count();
            if ($remaining === 0) {
                return response()->json([
                    'message' => 'Cannot delete the last super_admin account.',
                ], 422);
            }
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
