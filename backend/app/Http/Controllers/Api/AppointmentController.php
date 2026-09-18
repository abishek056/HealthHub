<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * List appointments.
     * Authenticated patients get their own appointments; hospital staff get their hospital's appointments.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Appointment::with(['hospital:id,name,address,phone,email'])
            ->latest('appointment_date');

        if ($user) {
            if ($user->role === 'patient') {
                $query->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                    if ($user->email) {
                        $q->orWhere('patient_email', $user->email);
                    }
                });
            } elseif (in_array($user->role, ['hospital_admin', 'hospital_staff']) && $user->hospital_id) {
                $query->where('hospital_id', $user->hospital_id);
            }
        }

        if ($request->filled('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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

        $userId = $request->user()?->id;

        $appointment = Appointment::create([
            'user_id'          => $userId,
            'hospital_id'      => $validated['hospital_id'],
            'department'       => $validated['department'],
            'patient_name'     => $validated['patient_name'],
            'patient_phone'    => $validated['patient_phone'],
            'patient_email'    => $validated['patient_email'] ?? $request->user()?->email,
            'appointment_date' => $validated['appointment_date'],
            'time_slot'        => $validated['time_slot'],
            'doctor_name'      => $validated['doctor_name'] ?? null,
            'symptoms'         => $validated['symptoms'] ?? null,
            'token_number'     => $tokenNumber,
            'status'           => 'confirmed',
        ]);

        $appointment->load('hospital:id,name,address,phone,email');

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

        $user = $request->user();
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

        $user = $request->user();
        if ($user && $user->role === 'patient' && $appointment->user_id && $appointment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $appointment->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully.',
            'data'    => $appointment,
        ]);
    }
}
