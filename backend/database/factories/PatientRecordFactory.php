<?php

namespace Database\Factories;

use App\Models\Hospital;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientRecordFactory extends Factory
{
    protected $model = PatientRecord::class;

    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'patient_name' => fake()->name(),
            'age' => fake()->numberBetween(1, 95),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'phone' => fake()->phoneNumber(),
            'diagnosis' => fake()->sentence(6),
            'treatment' => fake()->paragraph(2),
            'created_by' => User::factory(),
        ];
    }
}