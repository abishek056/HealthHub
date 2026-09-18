<?php

namespace Database\Seeders;

use App\Models\Ambulance;
use App\Models\Bed;
use App\Models\BloodBank;
use App\Models\BloodDonor;
use App\Models\Hospital;
use App\Models\OpdQueue;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        User::factory()->superAdmin()->create([
            'name' => 'Super Admin',
            'email' => 'admin@healthhub.com',
            'password' => Hash::make('password'),
            'phone' => '9800000001',
        ]);

        // 2. Hospitals
        $hospitals = collect([
            Hospital::factory()->create([
                'name' => 'Bir Hospital',
                'address' => 'Mahabouddha, Kathmandu',
                'phone' => '01-4221119',
            ]),
            Hospital::factory()->create([
                'name' => 'Tribhuvan University Teaching Hospital',
                'address' => 'Maharajgunj, Kathmandu',
                'phone' => '01-4412303',
            ]),
            Hospital::factory()->create([
                'name' => 'Patan Hospital',
                'address' => 'Lagankhel, Lalitpur',
                'phone' => '01-5522295',
            ]),
        ]);

        // 3. Hospital Admins & Staff
        foreach ($hospitals as $hospital) {
            User::factory()->hospitalAdmin()->create([
                'name' => $hospital->name . ' Admin',
                'email' => strtolower(str_replace([' ', '.'], '', $hospital->name)) . '@healthhub.com',
                'password' => Hash::make('password'),
                'hospital_id' => $hospital->id,
            ]);

            User::factory()->count(3)->create([
                'role' => 'hospital_staff',
                'hospital_id' => $hospital->id,
            ]);
        }

        // 4. Beds
        $wardTypes = ['ICU', 'Emergency', 'General', 'Private'];
        foreach ($hospitals as $hospital) {
            foreach ($wardTypes as $ward) {
                Bed::factory()->create([
                    'hospital_id' => $hospital->id,
                    'ward_type' => $ward,
                    'total_beds' => match ($ward) {
                        'ICU' => 8,
                        'Emergency' => 12,
                        'General' => 40,
                        'Private' => 15,
                    },
                    'available_beds' => match ($ward) {
                        'ICU' => rand(1, 5),
                        'Emergency' => rand(2, 8),
                        'General' => rand(10, 30),
                        'Private' => rand(3, 10),
                    },
                ]);
            }
        }

        // 5. Ambulances
        Ambulance::factory()->count(2)->create(['hospital_id' => $hospitals[0]->id]);
        Ambulance::factory()->count(2)->create(['hospital_id' => $hospitals[1]->id]);
        Ambulance::factory()->create(['hospital_id' => $hospitals[2]->id]);

        // 6. OPD Queues
        $departments = ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology'];
        foreach ($hospitals as $hospital) {
            foreach ($departments as $dept) {
                OpdQueue::factory()->create([
                    'hospital_id' => $hospital->id,
                    'department' => $dept,
                ]);
            }
        }

        // 7. Blood Banks
        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        foreach ($hospitals as $hospital) {
            foreach ($bloodGroups as $group) {
                BloodBank::factory()->create([
                    'hospital_id' => $hospital->id,
                    'blood_group' => $group,
                    'units_available' => rand(0, 35),
                ]);
            }
        }

        // 8. Blood Donors
        BloodDonor::factory()->count(15)->create();

        // 9. Patient Records
        $staffUsers = User::where('role', 'hospital_staff')->get();
        foreach ($hospitals as $hospital) {
            PatientRecord::factory()->count(7)->create([
                'hospital_id' => $hospital->id,
                'created_by' => $staffUsers->random()->id,
            ]);
        }

        $this->command->info('HealthHub database seeded successfully!');
        $this->command->info('Super Admin → admin@healthhub.com / password');
    }
}