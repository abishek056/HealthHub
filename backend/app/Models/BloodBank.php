<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodBank extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id', 'blood_group', 'units_available', 'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}