<?php

namespace Database\Factories;

use App\Models\Hospital;
use App\Models\OpdQueue;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpdQueueFactory extends Factory
{
    protected $model = OpdQueue::class;

    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'department' => fake()->randomElement([
                'General Medicine', 'Cardiology', 'Orthopedics',
                'Pediatrics', 'Gynecology', 'Dermatology', 'ENT',
            ]),
            'current_token' => fake()->numberBetween(1, 150),
            'estimated_wait_mins' => fake()->numberBetween(5, 120),
            'crowd_level' => fake()->randomElement(['low', 'medium', 'high']),
            'last_updated' => now(),
        ];
    }
}