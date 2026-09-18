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

            // Aggregated counts — only when relations are loaded
            'total_beds'      => $this->whenLoaded('beds',      fn () => (int) $this->beds->sum('total_beds')),
            'available_beds'  => $this->whenLoaded('beds',      fn () => (int) $this->beds->sum('available_beds')),
            'beds_total'      => $this->whenLoaded('beds',      fn () => (int) $this->beds->sum('total_beds')),
            'beds_available'  => $this->whenLoaded('beds',      fn () => (int) $this->beds->sum('available_beds')),
            'staff_count'     => $this->whenLoaded('users',     fn () => $this->users->count()),
            'ambulance_count' => $this->whenLoaded('ambulances', fn () => $this->ambulances->count()),
            'ambulances_count'=> $this->whenLoaded('ambulances', fn () => $this->ambulances->count()),
            'opd_queues_count'=> $this->whenLoaded('opdQueues',  fn () => $this->opdQueues->count()),
            'blood_banks_count'=> $this->whenLoaded('bloodBanks',fn () => $this->bloodBanks->count()),

            // Occupancy percentage (0–100)
            'occupancy_pct'   => $this->when(
                isset($this->occupancy_pct),
                $this->occupancy_pct,
                function () {
                    if ($this->relationLoaded('beds')) {
                        $total = (int) $this->beds->sum('total_beds');
                        $avail = (int) $this->beds->sum('available_beds');
                        return $total > 0 ? round((($total - $avail) / $total) * 100, 1) : 0;
                    }
                    return 0;
                }
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
