<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'appointment_id',
        'user_id',
        'patient_name',
        'age',
        'gender',
        'phone',
        'diagnosis',
        'treatment',
        'created_by',
    ];

    protected $casts = [
        'age' => 'integer',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The patient (user account) this record belongs to, if the
     * patient has an account and could be matched. This is what
     * lets a patient see this record — from any hospital — on
     * their own unified profile.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}