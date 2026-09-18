<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedAccess
{
    /**
     * Handle an incoming request.
     *
     * Checks if the authenticated user has one of the required roles.
     *
     * Usage:
     *   ->middleware(['auth:sanctum', 'role:super_admin'])
     *   ->middleware(['auth:sanctum', 'role:hospital_admin,hospital_staff'])
     *
     * Supported roles: super_admin, hospital_admin, hospital_staff
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  One or more roles (comma-separated or multiple parameters)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Flatten roles in case they were passed as a single comma-separated string
        $allowedRoles = collect($roles)
            ->flatMap(fn (string $role) => explode(',', $role))
            ->map(fn (string $role) => trim($role))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($allowedRoles)) {
            return response()->json([
                'message' => 'No roles specified for this route.',
            ], 500);
        }

        if (!in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Forbidden. You do not have the required role to access this resource.',
                'required_roles' => $allowedRoles,
                'your_role' => $user->role,
            ], 403);
        }

        return $next($request);
    }
}