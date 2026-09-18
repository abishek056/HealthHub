<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpdQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'department',
        'current_token',
        'estimated_wait_mins',
        'crowd_level',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
        'current_token' => 'integer',
        'estimated_wait_mins' => 'integer',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}