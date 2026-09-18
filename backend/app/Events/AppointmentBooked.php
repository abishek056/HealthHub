<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentBooked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $id;
    public int $hospital_id;
    public ?int $user_id;
    public string $token_number;
    public string $patient_name;
    public string $patient_phone;
    public ?string $patient_email;
    public string $department;
    public ?string $doctor_name;
    public string $appointment_date;
    public string $time_slot;
    public ?string $symptoms;
    public string $status;
    public string $created_at;

    public function __construct(Appointment $appointment)
    {
        $this->id = (int) $appointment->id;
        $this->hospital_id = (int) $appointment->hospital_id;
        $this->user_id = $appointment->user_id ? (int) $appointment->user_id : null;
        $this->token_number = $appointment->token_number;
        $this->patient_name = $appointment->patient_name;
        $this->patient_phone = $appointment->patient_phone;
        $this->patient_email = $appointment->patient_email;
        $this->department = $appointment->department;
        $this->doctor_name = $appointment->doctor_name;
        $this->appointment_date = is_string($appointment->appointment_date)
            ? $appointment->appointment_date
            : $appointment->appointment_date?->format('Y-m-d') ?? '';
        $this->time_slot = $appointment->time_slot;
        $this->symptoms = $appointment->symptoms;
        $this->status = $appointment->status ?? 'confirmed';
        $this->created_at = $appointment->created_at?->toIso8601String() ?? now()->toIso8601String();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("hospital.{$this->hospital_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AppointmentBooked';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->id,
            'hospital_id' => $this->hospital_id,
            'user_id' => $this->user_id,
            'token_number' => $this->token_number,
            'patient_name' => $this->patient_name,
            'patient_phone' => $this->patient_phone,
            'patient_email' => $this->patient_email,
            'department' => $this->department,
            'doctor_name' => $this->doctor_name,
            'appointment_date' => $this->appointment_date,
            'time_slot' => $this->time_slot,
            'symptoms' => $this->symptoms,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
