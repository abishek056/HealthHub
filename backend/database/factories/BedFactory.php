<?php

namespace Database\Factories;

use App\Models\Bed;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

class BedFactory extends Factory
{
    protected $model = Bed::class;

    public function definition(): array
    {
        $total = fake()->numberBetween(5, 40);

        return [
            'hospital_id' => Hospital::factory(),
            'ward_type' => fake()->randomElement(['ICU', 'Emergency', 'General', 'Private']),
            'total_beds' => $total,
            'available_beds' => fake()->numberBetween(0, $total),
            'last_updated' => now(),
        ];
    }
}
