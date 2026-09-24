<?php

namespace App\Http\Controllers\Api;

use App\Events\AppointmentBooked;
use App\Events\AppointmentStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * Helper to resolve the patient user account if matching phone, email, or name exists.
     */
    protected function resolvePatientUserId(?string $phone, ?string $email = null, ?string $patientName = null): ?int
    {
        if (! empty($phone)) {
            $user = User::where('role', 'patient')->where('phone', $phone)->first();
            if ($user) {
                return $user->id;
            }

            $clean = PatientRecordController::normalizePhone($phone);
            if ($clean && strlen($clean) >= 7) {
                $user = User::where('role', 'patient')
                    ->whereRaw(
                        "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+', ''), '(', ''), ')', '') LIKE ?",
                        ["%{$clean}"]
                    )
                    ->first();
                if ($user) {
                    return $user->id;
                }
            }
        }

        if (! empty($email)) {
            $user = User::where('role', 'patient')->where('email', $email)->first();
            if ($user) {
                return $user->id;
            }
        }

        if (! empty($patientName)) {
            $user = User::where('role', 'patient')->where('name', $patientName)->first();
            if ($user) {
                return $user->id;
            }
        }

        return null;
    }
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

        $query = Appointment::with(['hospital:id,name,address,phone,email', 'patientRecord'])
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

        $userId = null;
        if ($user && $user->role === 'patient') {
            $userId = $user->id;
        } else {
            // Booked by hospital staff/admin or guest: attempt to link to existing patient account
            $userId = $this->resolvePatientUserId(
                $validated['patient_phone'] ?? null,
                $validated['patient_email'] ?? null,
                $validated['patient_name'] ?? null
            );
        }

        $patientEmail = $validated['patient_email'] ?? ($user && $user->role === 'patient' ? $user->email : null);

        $appointment = Appointment::create([
            'user_id'          => $userId,
            'hospital_id'      => $validated['hospital_id'],
            'department'       => $validated['department'],
            'patient_name'     => $validated['patient_name'],
            'patient_phone'    => $validated['patient_phone'],
            'patient_email'    => $patientEmail,
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
        $appointment = Appointment::with(['hospital:id,name,address,phone,email', 'patientRecord'])->findOrFail($id);

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
     * Automatically registers/updates the patient record with problem diagnosis when completed.
     */
    public function updateStatus(Request $request, ...$params): JsonResponse
    {
        $validated = $request->validate([
            'status'      => 'required|string|in:confirmed,completed,cancelled',
            'doctor_name' => 'nullable|string|max:150',
            'diagnosis'   => 'nullable|string|max:2000',
            'treatment'   => 'nullable|string|max:2000',
            'age'         => 'nullable|integer|min:0|max:150',
            'gender'      => 'nullable|string|in:male,female,other',
        ]);

        $appointmentId = $request->route('appointmentId') ?? $request->route('id') ?? ($params[1] ?? $params[0] ?? null);
        $appointment = Appointment::with(['hospital:id,name,address,phone,email'])->findOrFail($appointmentId);
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

        // Automatically record in patient detail section (patient_records) upon completion
        if ($validated['status'] === 'completed') {
            $diagnosis = $request->input('diagnosis')
                ?: ($appointment->symptoms ? 'Reported Symptoms: ' . $appointment->symptoms : 'Completed OPD Consultation (' . $appointment->department . ')');
            $treatment = $request->input('treatment')
                ?: ('Consultation completed' . ($appointment->doctor_name ? ' by Dr. ' . $appointment->doctor_name : ''));

            $updateData['diagnosis'] = $diagnosis;
            $updateData['treatment'] = $treatment;

            $appointment->update($updateData);

            // Check if a patient record was already created specifically for THIS appointment
            $appointmentRecord = \App\Models\PatientRecord::where('appointment_id', $appointment->id)->first();

            // Find prior patient demographic history at this hospital as fallback for age/gender
            $previousRecord = \App\Models\PatientRecord::where('hospital_id', $appointment->hospital_id)
                ->where(function ($q) use ($appointment) {
                    if (!empty($appointment->user_id)) {
                        $q->where('user_id', $appointment->user_id);
                    } else {
                        $q->where('patient_name', $appointment->patient_name);
                    }
                    if (!empty($appointment->patient_phone)) {
                        $q->orWhere('phone', $appointment->patient_phone);
                    }
                })
                ->latest('id')
                ->first();

            $age = $request->filled('age')
                ? (int) $request->input('age')
                : ($appointmentRecord?->age ?? $previousRecord?->age ?? 30);

            $gender = $request->input('gender')
                ?: ($appointmentRecord?->gender ?? $previousRecord?->gender ?? 'other');

            // Resolve the patient's user account properly
            $patientUserId = $appointment->user_id;
            if ($patientUserId) {
                $chk = User::find($patientUserId);
                if ($chk && $chk->role !== 'patient') {
                    $patientUserId = null; // Prevent hospital staff user_id from being saved as patient user_id
                }
            }
            if (! $patientUserId) {
                $patientUserId = $this->resolvePatientUserId(
                    $appointment->patient_phone,
                    $appointment->patient_email,
                    $appointment->patient_name
                );
            }
            if (! $patientUserId && $previousRecord?->user_id) {
                $patientUserId = $previousRecord->user_id;
            }

            // Backfill appointment user_id if it was unlinked
            if ($patientUserId && ! $appointment->user_id) {
                $appointment->update(['user_id' => $patientUserId]);
            }

            if ($appointmentRecord) {
                // If this specific appointment already had a patient record, update it
                $appointmentRecord->update([
                    'user_id'      => $patientUserId ?? $appointmentRecord->user_id,
                    'patient_name' => $appointment->patient_name,
                    'diagnosis'    => $diagnosis,
                    'treatment'    => $treatment,
                    'phone'        => $appointment->patient_phone ?: $appointmentRecord->phone,
                    'age'          => $age,
                    'gender'       => $gender,
                ]);
            } else {
                // Every completed appointment creates its OWN distinct patient record (visit record)
                // so patients with multiple completed visits keep their entire history in Patient Details
                \App\Models\PatientRecord::create([
                    'hospital_id'    => $appointment->hospital_id,
                    'appointment_id' => $appointment->id,
                    'user_id'        => $patientUserId,
                    'patient_name'   => $appointment->patient_name,
                    'age'            => $age,
                    'gender'         => $gender,
                    'phone'          => $appointment->patient_phone,
                    'diagnosis'      => $diagnosis,
                    'treatment'      => $treatment,
                    'created_by'     => $user?->id ?? 1,
                ]);
            }
        } else {
            $appointment->update($updateData);
        }

        try {
            event(new AppointmentStatusUpdated($appointment));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment status updated successfully.',
            'data'    => $appointment->fresh()->load(['hospital:id,name,address,phone,email', 'patientRecord']),
        ]);
    }
}
