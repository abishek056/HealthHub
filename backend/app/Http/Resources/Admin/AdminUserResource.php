<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'role'        => $this->role,
            'is_active'   => $this->is_active,
            'hospital'    => $this->whenLoaded('hospital', fn () => [
                'id'   => $this->hospital->id,
                'name' => $this->hospital->name,
            ]),
            'last_login'  => $this->last_login_at?->toIso8601String(),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
