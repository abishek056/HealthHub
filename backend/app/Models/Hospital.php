<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'address', 'phone', 'email',
        'latitude', 'longitude', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class);
    }

    public function ambulances(): HasMany
    {
        return $this->hasMany(Ambulance::class);
    }

    public function opdQueues(): HasMany
    {
        return $this->hasMany(OpdQueue::class);
    }

    public function bloodBanks(): HasMany
    {
        return $this->hasMany(BloodBank::class);
    }

    public function patientRecords(): HasMany
    {
        return $this->hasMany(PatientRecord::class);
    }
}