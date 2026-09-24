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
        // 1. Super Admin & Demo Patient
        User::factory()->superAdmin()->create([
            'name' => 'Super Admin',
            'email' => 'admin@healthhub.com',
            'password' => Hash::make('password'),
            'phone' => '9800000001',
        ]);

        User::factory()->create([
            'name' => 'Demo Patient',
            'email' => 'patient@healthhub.com',
            'password' => Hash::make('password'),
            'role' => 'patient',
            'phone' => '9800000002',
        ]);

        // 2. Hospitals
        $hospitals = collect([
            Hospital::factory()->create([
                'name' => 'Bir Hospital',
                'address' => 'Mahabouddha, Kathmandu',
                'phone' => '01-4221119',
                'latitude' => 27.7056,
                'longitude' => 85.3131,
            ]),
            Hospital::factory()->create([
                'name' => 'Tribhuvan University Teaching Hospital',
                'address' => 'Maharajgunj, Kathmandu',
                'phone' => '01-4412303',
                'latitude' => 27.7350,
                'longitude' => 85.3304,
            ]),
            Hospital::factory()->create([
                'name' => 'Patan Hospital',
                'address' => 'Lagankhel, Lalitpur',
                'phone' => '01-5522295',
                'latitude' => 27.6685,
                'longitude' => 85.3206,
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

        // 7. Blood Banks (Only Bir Hospital and TUTH have blood bank facilities; Patan has none)
        $bloodStockBir = [
            'A+' => 18, 'B+' => 22, 'O+' => 30, 'AB+' => 8,
            'O-' => 4,  'A-' => 3,  'B-' => 0,  'AB-' => 0,
        ];
        $bloodStockTUTH = [
            'O+' => 25, 'A-' => 6,  'B+' => 14, 'AB+' => 10,
            'A+' => 0,  'O-' => 0,  'B-' => 0,  'AB-' => 0,
        ];

        foreach ($hospitals as $hospital) {
            $stockMap = null;
            if (str_contains($hospital->name, 'Bir')) {
                $stockMap = $bloodStockBir;
            } elseif (str_contains($hospital->name, 'Teaching') || str_contains($hospital->name, 'TUTH')) {
                $stockMap = $bloodStockTUTH;
            }

            if ($stockMap) {
                foreach ($stockMap as $group => $units) {
                    BloodBank::factory()->create([
                        'hospital_id'     => $hospital->id,
                        'blood_group'     => $group,
                        'units_available' => $units,
                    ]);
                }
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