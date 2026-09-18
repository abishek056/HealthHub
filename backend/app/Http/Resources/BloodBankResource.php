<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BloodBankResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'hospital'   => $this->whenLoaded('hospital', fn () => [
                'id'      => $this->hospital->id,
                'name'    => $this->hospital->name,
                'address' => $this->hospital->address,
                'phone'   => $this->hospital->phone,
            ]),
            'blood_group'    => $this->blood_group,
            'units_available' => $this->units_available,
            'last_updated'   => $this->updated_at?->toIso8601String(),
            'latitude'       => $this->hospital?->latitude,
            'longitude'      => $this->hospital?->longitude,
            'distance_km'    => $this->when(isset($this->distance_km), $this->distance_km),
        ];
    }
}
