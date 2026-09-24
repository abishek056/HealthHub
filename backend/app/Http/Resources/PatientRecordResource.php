<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientRecordResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'hospital_id'  => $this->hospital_id,
            'hospital'     => $this->whenLoaded('hospital', fn () => [
                'id'      => $this->hospital->id,
                'name'    => $this->hospital->name,
                'address' => $this->hospital->address,
                'phone'   => $this->hospital->phone,
            ]),
            'user_id'      => $this->user_id,
            'patient_name' => $this->patient_name,
            'age'          => (int) $this->age,
            'gender'       => $this->gender,
            'phone'        => $this->phone,
            'diagnosis'    => $this->diagnosis,
            'treatment'    => $this->treatment,
            'created_by'   => $this->created_by,
            'creator'      => $this->whenLoaded('creator', fn () => [
                'id'    => $this->creator->id,
                'name'  => $this->creator->name,
                'email' => $this->creator->email,
                'role'  => $this->creator->role,
            ]),
            'appointment_id' => $this->appointment_id,
            'appointment'    => $this->whenLoaded('appointment', fn () => [
                'id'               => $this->appointment->id,
                'token_number'     => $this->appointment->token_number,
                'department'       => $this->appointment->department,
                'doctor_name'      => $this->appointment->doctor_name,
                'appointment_date' => $this->appointment->appointment_date?->toDateString(),
                'time_slot'        => $this->appointment->time_slot,
                'status'           => $this->appointment->status,
            ]),
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}