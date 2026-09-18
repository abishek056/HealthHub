<?php

namespace Tests\Feature;

use App\Models\Hospital;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthHubApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_hospitals_endpoint_returns_ok(): void
    {
        Hospital::factory()->create(['name' => 'Bir Hospital', 'is_active' => true]);

        $response = $this->getJson('/api/hospitals');

        $response->assertStatus(200);
    }

    public function test_super_admin_can_login_and_access_stats(): void
    {
        $admin = User::factory()->superAdmin()->create([
            'email'    => 'admin@healthhub.com',
            'password' => bcrypt('password'),
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email'    => 'admin@healthhub.com',
            'password' => 'password',
        ]);

        $loginResponse->assertStatus(200)
                      ->assertJsonStructure(['token', 'user']);

        $token = $loginResponse->json('token');

        $statsResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                              ->getJson('/api/admin/stats');

        $statsResponse->assertStatus(200);
    }

    public function test_emergency_routing_with_blood_group(): void
    {
        $hospital = Hospital::factory()->create([
            'name' => 'Kathmandu Emergency Hospital',
            'latitude' => 27.7056,
            'longitude' => 85.3131,
            'is_active' => true,
        ]);

        $hospital->bloodBanks()->create([
            'blood_group' => 'O+',
            'units_available' => 5,
            'last_updated' => now(),
        ]);

        $response = $this->getJson('/api/emergency/find-nearest-hospital?latitude=27.7052&longitude=85.3144&blood_group=O+');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.hospital.has_blood_group', true);
    }

    public function test_super_admin_can_delete_hospital_with_all_associated_data(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $hospital = Hospital::factory()->create(['name' => 'Hospital To Delete']);

        // Attach related records
        $staff = User::factory()->create([
            'role' => 'hospital_admin',
            'hospital_id' => $hospital->id,
        ]);

        $hospital->beds()->create([
            'ward_type' => 'ICU',
            'total_beds' => 10,
            'available_beds' => 5,
        ]);

        $hospital->ambulances()->create([
            'driver_name' => 'Driver One',
            'vehicle_number' => 'BA-9999',
            'phone' => '9800000000',
        ]);

        $hospital->opdQueues()->create([
            'department' => 'Emergency',
        ]);

        $hospital->bloodBanks()->create([
            'blood_group' => 'A+',
            'units_available' => 4,
        ]);

        $hospital->patientRecords()->create([
            'patient_name' => 'Patient X',
            'age' => 40,
            'gender' => 'male',
            'created_by' => $staff->id,
        ]);

        $hospital->appointments()->create([
            'patient_name' => 'Appt Person',
            'patient_phone' => '9811111111',
            'department' => 'General',
            'appointment_date' => now()->toDateString(),
            'time_slot' => '09:00 AM',
            'token_number' => 'TOK-TEST-DEL-1',
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($admin)
                         ->deleteJson("/api/admin/hospitals/{$hospital->id}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Hospital and all associated data deleted successfully.']);

        $this->assertDatabaseMissing('hospitals', ['id' => $hospital->id]);
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
        $this->assertDatabaseMissing('beds', ['hospital_id' => $hospital->id]);
        $this->assertDatabaseMissing('ambulances', ['hospital_id' => $hospital->id]);
        $this->assertDatabaseMissing('opd_queues', ['hospital_id' => $hospital->id]);
        $this->assertDatabaseMissing('blood_banks', ['hospital_id' => $hospital->id]);
        $this->assertDatabaseMissing('patient_records', ['hospital_id' => $hospital->id]);
        $this->assertDatabaseMissing('appointments', ['hospital_id' => $hospital->id]);
    }
}
