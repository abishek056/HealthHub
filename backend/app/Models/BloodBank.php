<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodBank extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'blood_group',
        'units_available',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
        'units_available' => 'integer',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function scopeByBloodGroup(Builder $query, string $group): Builder
    {
        return $query->where('blood_group', $group);
    }

    public function scopeWithStock(Builder $query): Builder
    {
        return $query->where('units_available', '>', 0);
    }
}