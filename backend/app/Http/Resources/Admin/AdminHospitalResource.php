<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminHospitalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'address'    => $this->address,
            'phone'      => $this->phone,
            'email'      => $this->email,
            'city'       => $this->city,
            'state'      => $this->state,
            'type'       => $this->type,
            'latitude'   => $this->latitude,
            'longitude'  => $this->longitude,
            'is_active'  => $this->is_active,
            'beds_total' => $this->beds_total,

            // Aggregated counts — only when relations are loaded
            'staff_count'     => $this->whenLoaded('users',     fn () => $this->users->count()),
            'beds_available'  => $this->whenLoaded('beds',      fn () => $this->beds->sum('available')),
            'ambulance_count' => $this->whenLoaded('ambulances', fn () => $this->ambulances->count()),

            // Occupancy percentage (0–100)
            'occupancy_pct'   => $this->when(
                isset($this->occupancy_pct),
                $this->occupancy_pct
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
