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
}
