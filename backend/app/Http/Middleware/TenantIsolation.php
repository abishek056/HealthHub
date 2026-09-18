<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantIsolation
{
    /**
     * Handle an incoming request.
     *
     * Ensures hospital_admin and hospital_staff can ONLY access data
     * belonging to their own hospital. super_admin can access all hospitals.
     *
     * The middleware looks for a hospital identifier in the following order:
     *   1. Route parameter: hospital_id
     *   2. Route parameter: id (common for /hospitals/{id}/...)
     *   3. Request input: hospital_id
     *
     * Usage:
     *   ->middleware(['auth:sanctum', 'role:hospital_staff', 'tenant'])
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // super_admin can access any hospital's data
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // hospital_admin and hospital_staff must have a hospital_id assigned
        if ($user->hospital_id === null) {
            return response()->json([
                'message' => 'Forbidden. Your account is not associated with any hospital.',
            ], 403);
        }

        // Resolve the hospital ID being requested
        $requestedHospitalId = $this->resolveHospitalId($request);

        // If no hospital context is present in the request, allow the request
        // (controllers may still scope queries by $user->hospital_id)
        if ($requestedHospitalId === null) {
            return $next($request);
        }

        // Enforce tenant isolation
        if ((int) $requestedHospitalId !== (int) $user->hospital_id) {
            return response()->json([
                'message' => 'Forbidden. You can only access data belonging to your own hospital.',
                'your_hospital_id' => $user->hospital_id,
                'requested_hospital_id' => (int) $requestedHospitalId,
            ], 403);
        }

        return $next($request);
    }

    /**
     * Try to extract the hospital ID from the request.
     */
    protected function resolveHospitalId(Request $request): ?int
    {
        // 1. Explicit route parameter named hospital_id
        if ($request->route('hospital_id') !== null) {
            return (int) $request->route('hospital_id');
        }

        // 2. Common pattern: /hospitals/{id}/...
        //    Only treat {id} as hospital_id when the route path contains "hospitals"
        $route = $request->route();
        if ($route) {
            $uri = $route->uri();
            if (str_contains($uri, 'hospitals') && $request->route('id') !== null) {
                return (int) $request->route('id');
            }
        }

        // 3. Request body / query parameter
        if ($request->filled('hospital_id')) {
            return (int) $request->input('hospital_id');
        }

        return null;
    }
}