<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BloodDonorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'blood_group'        => $this->blood_group,
            'phone'              => $this->when($request->user()?->id === $this->user_id, $this->phone),
            'city'               => $this->city,
            'latitude'           => $this->latitude,
            'longitude'          => $this->longitude,
            'last_donation_date' => $this->last_donation_date?->toDateString(),
            'is_active'          => $this->is_active,
            'weight'             => $this->weight,
            'date_of_birth'      => $this->date_of_birth?->toDateString(),
            'distance_km'        => $this->when(isset($this->distance_km), $this->distance_km),
            'eligible'           => $this->when(isset($this->eligible), $this->eligible),
            'created_at'         => $this->created_at?->toIso8601String(),
        ];
    }
}
