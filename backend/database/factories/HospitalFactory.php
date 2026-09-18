<?php

namespace Database\Factories;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

class HospitalFactory extends Factory
{
    protected $model = Hospital::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Hospital',
            'address' => fake()->address(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'latitude' => fake()->latitude(26.0, 28.5),
            'longitude' => fake()->longitude(80.0, 88.5),
            'is_active' => true,
        ];
    }
}