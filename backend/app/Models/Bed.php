<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bed extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'ward_type',
        'total_beds',
        'available_beds',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
        'total_beds' => 'integer',
        'available_beds' => 'integer',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('available_beds', '>', 0);
    }

    public function scopeByWardType(Builder $query, string $type): Builder
    {
        return $query->where('ward_type', $type);
    }
}