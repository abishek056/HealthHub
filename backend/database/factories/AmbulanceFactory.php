<?php

namespace Database\Factories;

use App\Models\Ambulance;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

class AmbulanceFactory extends Factory
{
    protected $model = Ambulance::class;

    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'driver_name' => fake()->name(),
            'vehicle_number' => strtoupper(fake()->bothify('BA-##-??-####')),
            'phone' => fake()->phoneNumber(),
            'latitude' => fake()->latitude(26.0, 28.5),
            'longitude' => fake()->longitude(80.0, 88.5),
            'is_available' => fake()->boolean(70),
            'is_on_call' => fake()->boolean(30),
        ];
    }
}