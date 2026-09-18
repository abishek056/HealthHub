<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hospital_id',
        'patient_name',
        'patient_phone',
        'patient_email',
        'department',
        'doctor_name',
        'appointment_date',
        'time_slot',
        'token_number',
        'status',
        'symptoms',
    ];

    protected $casts = [
        'appointment_date' => 'date',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
