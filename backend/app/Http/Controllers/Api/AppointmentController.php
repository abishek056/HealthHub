<?php

namespace App\Http\Controllers\Api;

use App\Events\AppointmentBooked;
use App\Events\AppointmentStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * Helper to resolve the authenticated user via Sanctum guard or default request user.
     */
    protected function resolveUser(Request $request)
    {
        return $request->user() ?? $request->user('sanctum') ?? auth('sanctum')->user();
    }

    /**
     * List appointments.
     * Authenticated patients get their own appointments; hospital staff get their hospital's appointments.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        // Require authentication to view appointments to prevent privacy leakage
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'data'    => [],
            ], 401);
        }

        $query = Appointment::with(['hospital:id,name,address,phone,email'])
            ->latest('appointment_date')
            ->latest('created_at');

        if ($user->role === 'patient') {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if ($user->email) {
                    $q->orWhere(function ($sq) use ($user) {
                        $sq->where('patient_email', $user->email)
                           ->whereNull('user_id');
                    });
                }
            });
        } elseif (in_array($user->role, ['hospital_admin', 'hospital_staff'])) {
            $hospitalId = $user->hospital_id ?? $request->hospital_id;
            if ($hospitalId) {
                $query->where('hospital_id', $hospitalId);
            }
        } elseif ($user->role === 'super_admin') {
            if ($request->filled('hospital_id')) {
                $query->where('hospital_id', $request->hospital_id);
            }
        }

        if ($request->filled('hospital_id') && in_array($user->role, ['hospital_admin', 'hospital_staff', 'super_admin'])) {
            $query->where('hospital_id', $request->hospital_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->date);
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('patient_name', 'like', "%{$search}%")
                  ->orWhere('patient_phone', 'like', "%{$search}%")
                  ->orWhere('token_number', 'like', "%{$search}%")
                  ->orWhere('doctor_name', 'like', "%{$search}%");
            });
        }

        $appointments = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $appointments,
        ]);
    }

    /**
     * Book a new hospital appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hospital_id'      => 'required|integer|exists:hospitals,id',
            'department'       => 'required|string|max:100',
            'patient_name'     => 'required|string|max:150',
            'patient_phone'    => 'required|string|max:25',
            'patient_email'    => 'nullable|email|max:150',
            'appointment_date' => 'required|date',
            'time_slot'        => 'required|string|max:50',
            'doctor_name'      => 'nullable|string|max:150',
            'symptoms'         => 'nullable|string|max:1000',
        ]);

        $hospital = Hospital::findOrFail($validated['hospital_id']);

        // Generate unique token number, e.g. APT-BIR-9402
        $hospitalCode = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $hospital->name) ?: 'HOSP', 0, 3));
        $randomSeq    = strtoupper(Str::random(4));
        $tokenNumber  = "APT-{$hospitalCode}-{$randomSeq}";

        $user   = $this->resolveUser($request);

        // Hospital staff and administrators cannot book appointments for other hospitals
        if ($user && in_array($user->role, ['hospital_admin', 'hospital_staff'])) {
            if ($user->hospital_id && (int) $validated['hospital_id'] !== (int) $user->hospital_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Hospital staff and administrators cannot book appointments for other hospitals.',
                ], 403);
            }
        }

        $userId = $user?->id;

        $appointment = Appointment::create([
            'user_id'          => $userId,
            'hospital_id'      => $validated['hospital_id'],
            'department'       => $validated['department'],
            'patient_name'     => $validated['patient_name'],
            'patient_phone'    => $validated['patient_phone'],
            'patient_email'    => $validated['patient_email'] ?? $user?->email,
            'appointment_date' => $validated['appointment_date'],
            'time_slot'        => $validated['time_slot'],
            'doctor_name'      => $validated['doctor_name'] ?? null,
            'symptoms'         => $validated['symptoms'] ?? null,
            'token_number'     => $tokenNumber,
            'status'           => 'confirmed',
        ]);

        $appointment->load('hospital:id,name,address,phone,email');

        // Broadcast real-time event to hospital channel
        try {
            event(new AppointmentBooked($appointment));
        } catch (\Throwable $e) {
            // Log Reverb broadcast error without failing the HTTP request
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully.',
            'data'    => $appointment,
        ], 201);
    }

    /**
     * Show a single appointment.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::with(['hospital:id,name,address,phone,email'])->findOrFail($id);

        $user = $this->resolveUser($request);
        if ($user && $user->role === 'patient' && $appointment->user_id && $appointment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $appointment,
        ]);
    }

    /**
     * Cancel an appointment.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $user = $this->resolveUser($request);
        if ($user && $user->role === 'patient' && $appointment->user_id && $appointment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $appointment->update(['status' => 'cancelled']);

        try {
            event(new AppointmentStatusUpdated($appointment));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully.',
            'data'    => $appointment,
        ]);
    }

    /**
     * Update appointment status (for hospital staff / admin / doctor).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'      => 'required|string|in:confirmed,completed,cancelled',
            'doctor_name' => 'nullable|string|max:150',
        ]);

        $appointment = Appointment::with(['hospital:id,name,address,phone,email'])->findOrFail($id);
        $user = $this->resolveUser($request);

        if ($user) {
            if ($user->role === 'patient') {
                if ($appointment->user_id !== $user->id) {
                    return response()->json(['message' => 'Unauthorized access.'], 403);
                }
                if ($validated['status'] !== 'cancelled') {
                    return response()->json(['message' => 'Patients can only cancel appointments.'], 403);
                }
            } elseif (in_array($user->role, ['hospital_admin', 'hospital_staff'])) {
                if ($user->hospital_id && $appointment->hospital_id !== $user->hospital_id) {
                    return response()->json(['message' => 'Unauthorized for this hospital.'], 403);
                }
            }
        }

        $updateData = ['status' => $validated['status']];
        if (isset($validated['doctor_name'])) {
            $updateData['doctor_name'] = $validated['doctor_name'];
        }

        $appointment->update($updateData);

        try {
            event(new AppointmentStatusUpdated($appointment));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment status updated successfully.',
            'data'    => $appointment,
        ]);
    }
}
