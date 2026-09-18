<?php

namespace Database\Factories;

use App\Models\BloodDonor;
use Illuminate\Database\Eloquent\Factories\Factory;

class BloodDonorFactory extends Factory
{
    protected $model = BloodDonor::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'blood_group' => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
            'latitude' => fake()->latitude(26.0, 28.5),
            'longitude' => fake()->longitude(80.0, 88.5),
            'last_donation_date' => fake()->optional()->dateTimeBetween('-2 years', 'now'),
            'donations_count' => fake()->numberBetween(0, 15),
            'is_available' => fake()->boolean(80),
        ];
    }
}