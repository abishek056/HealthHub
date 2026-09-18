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
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
