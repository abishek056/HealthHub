<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ambulance extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id', 'driver_name', 'vehicle_number', 'phone',
        'latitude', 'longitude', 'is_available', 'is_on_call',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'is_on_call' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}