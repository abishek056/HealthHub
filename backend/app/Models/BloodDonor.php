<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodDonor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'phone', 'email', 'blood_group',
        'latitude', 'longitude', 'last_donation_date',
        'donations_count', 'is_available',
    ];

    protected $casts = [
        'last_donation_date' => 'date',
        'is_available' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];
}