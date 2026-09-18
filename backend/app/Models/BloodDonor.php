<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class BloodDonor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'blood_group',
        'latitude',
        'longitude',
        'last_donation_date',
        'donations_count',
        'is_available',
    ];

    protected $casts = [
        'last_donation_date' => 'date',
        'is_available' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
        'donations_count' => 'integer',
    ];

    protected $appends = [
        'is_eligible',
    ];

    /**
     * Accessor: can donate if never donated or last donation ≥ 3 months ago.
     */
    protected function isEligible(): Attribute
    {
        return Attribute::make(
            get: function (): bool {
                if (is_null($this->last_donation_date)) {
                    return true;
                }

                return $this->last_donation_date->lte(Carbon::now()->subMonths(3));
            }
        );
    }

    public function scopeEligible(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereNull('last_donation_date')
              ->orWhere('last_donation_date', '<=', Carbon::now()->subMonths(3)->toDateString());
        });
    }

    public function scopeByBloodGroup(Builder $query, string $group): Builder
    {
        return $query->where('blood_group', $group);
    }
}