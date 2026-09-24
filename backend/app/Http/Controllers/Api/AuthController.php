<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login - returns token + user data + role
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'token_type' => 'Bearer',
            'user'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->role,
                'phone'       => $user->phone,
                'hospital_id' => $user->hospital_id,
            ],
        ]);
    }

    /**
     * Public registration for normal users / patients
     */
    public function registerPatient(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string|max:25',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'patient',
            'phone'    => $validated['phone'] ?? null,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message'    => 'Account created successfully',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'phone' => $user->phone,
            ],
        ], 201);
    }

    /**
     * Register new user (super_admin only)
     */
    public function register(Request $request): JsonResponse
    {
        // Only super_admin can register new users
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'message' => 'Unauthorized. Only super_admin can register users.',
            ], 403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8|confirmed',
            'role'        => 'required|in:super_admin,hospital_admin,hospital_staff',
            'hospital_id' => 'nullable|exists:hospitals,id',
        ]);

        $user = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'role'        => $validated['role'],
            'hospital_id' => $validated['hospital_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->role,
                'hospital_id' => $user->hospital_id,
            ],
        ], 201);
    }

    /**
     * Register a patient account directly from the hospital portal.
     * For use by hospital_staff and hospital_admin to onboard patients
     * who are unable to or struggle with self-registration.
     */
    public function registerPatientByStaff(Request $request): JsonResponse
    {
        $actingUser = $request->user();

        // Only hospital_staff, hospital_admin, or super_admin can use this endpoint
        if (! in_array($actingUser?->role, ['hospital_staff', 'hospital_admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only hospital staff or administrators can register patients.',
            ], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string|max:25',
        ]);

        $patient = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'patient',
            'phone'    => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'message' => 'Patient account registered successfully.',
            'user'    => [
                'id'    => $patient->id,
                'name'  => $patient->name,
                'email' => $patient->email,
                'role'  => $patient->role,
                'phone' => $patient->phone,
            ],
        ], 201);
    }

    /**
     * Logout - invalidate current token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user data
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->role,
                'phone'       => $user->phone,
                'hospital_id' => $user->hospital_id,
            ],
        ]);
    }
}