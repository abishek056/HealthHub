<?php

namespace Database\Factories;

use App\Models\BloodBank;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

class BloodBankFactory extends Factory
{
    protected $model = BloodBank::class;

    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'blood_group' => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
            'units_available' => fake()->numberBetween(0, 50),
            'last_updated' => now(),
        ];
    }
}