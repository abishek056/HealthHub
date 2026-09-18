<?php

namespace App\Console\Commands;

use App\Models\Ambulance;
use App\Models\Bed;
use App\Models\BloodBank;
use App\Models\BloodDonor;
use App\Models\Hospital;
use App\Models\OpdQueue;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckBackendHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'healthhub:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run a full end-to-end health check across all HealthHub API modules, database, and tenant isolation';

    private int $passed = 0;
    private int $failed = 0;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->newLine();
        $this->info('===========================================================');
        $this->info('         🏥 HealthHub Backend Comprehensive Health Check    ');
        $this->info('===========================================================');
        $this->newLine();

        // 1. Database & Tables Check
        $this->checkDatabase();

        // 2. Public API Endpoints
        $this->checkPublicEndpoints();

        // 3. Super Admin Authentication & Admin APIs
        $adminToken = $this->checkSuperAdminFlow();

        // 4. Hospital Staff Flow & Tenant Isolation (Patient Records)
        $this->checkStaffAndTenantFlow();

        // Summary
        $this->newLine();
        $this->info('===========================================================');
        $total = $this->passed + $this->failed;
        if ($this->failed === 0) {
            $this->info("  🎉 ALL CHECKS PASSED: {$this->passed}/{$total} tests successful!");
            $this->info('  The backend is fully functional and ready for production/frontend.');
        } else {
            $this->error("  ⚠️ COMPLETED WITH ISSUES: {$this->passed} passed, {$this->failed} failed.");
        }
        $this->info('===========================================================');
        $this->newLine();

        return $this->failed === 0 ? 0 : 1;
    }

    private function checkDatabase(): void
    {
        $this->comment('--- [1/4] Database Connectivity & Data Check ---');

        try {
            DB::connection()->getPdo();
            $this->logResult('Database Connection', true, 'Connected to ' . config('database.default'));
        } catch (\Throwable $e) {
            $this->logResult('Database Connection', false, $e->getMessage());
            return;
        }

        $tables = [
            'Hospitals'       => Hospital::count(),
            'Users'           => User::count(),
            'Beds'            => Bed::count(),
            'Ambulances'      => Ambulance::count(),
            'OPD Queues'      => OpdQueue::count(),
            'Blood Banks'     => BloodBank::count(),
            'Blood Donors'    => BloodDonor::count(),
            'Patient Records' => PatientRecord::count(),
        ];

        foreach ($tables as $name => $count) {
            $this->logResult("Table Data: {$name}", $count > 0, "{$count} rows found");
        }
        $this->newLine();
    }

    private function checkPublicEndpoints(): void
    {
        $this->comment('--- [2/4] Public API Endpoints ---');

        $hospital = Hospital::first();
        $hospitalId = $hospital ? $hospital->id : 1;

        $lat = $hospital?->latitude ?? 27.705;
        $lon = $hospital?->longitude ?? 85.314;

        $endpoints = [
            ['GET', '/api/hospitals', null, 200, 'List all hospitals'],
            ['GET', "/api/hospitals/{$hospitalId}", null, 200, 'Hospital details'],
            ['GET', "/api/hospitals/{$hospitalId}/beds", null, 200, 'Hospital beds summary'],
            ['GET', "/api/hospitals/{$hospitalId}/ambulances", null, 200, 'Hospital ambulances'],
            ['GET', "/api/hospitals/{$hospitalId}/opd", null, 200, 'OPD queue status'],
            ['GET', '/api/blood-banks', null, 200, 'Blood banks inventory'],
            ['GET', '/api/blood-donors', null, 200, 'Registered donors list'],
            ['GET', "/api/emergency/find-nearest-hospital?latitude={$lat}&longitude={$lon}&radius=50", null, 200, 'Emergency nearest routing'],
        ];

        foreach ($endpoints as [$method, $uri, $body, $expectedStatus, $desc]) {
            $res = $this->dispatchRequest($method, $uri, $body);
            $isOk = $res->getStatusCode() === $expectedStatus;
            $this->logResult("{$method} {$uri}", $isOk, "{$desc} (HTTP {$res->getStatusCode()})");
        }
        $this->newLine();
    }

    private function checkSuperAdminFlow(): ?string
    {
        $this->comment('--- [3/4] Super Admin & Administration Flow ---');

        // Login
        $loginRes = $this->dispatchRequest('POST', '/api/auth/login', [
            'email'    => 'admin@healthhub.com',
            'password' => 'password',
        ]);

        $loginOk = $loginRes->getStatusCode() === 200;
        $data = json_decode($loginRes->getContent(), true);
        $token = $data['token'] ?? null;

        $this->logResult('POST /api/auth/login (Super Admin)', $loginOk && $token !== null, 'Authenticated & received Sanctum token');

        if (! $token) {
            $this->logResult('Super Admin API Access', false, 'Skipping admin routes due to failed login');
            return null;
        }

        // Authenticated routes
        $adminEndpoints = [
            ['GET', '/api/auth/me', 200, 'Super admin profile'],
            ['GET', '/api/admin/stats', 200, 'Admin aggregated statistics'],
            ['GET', '/api/admin/hospitals/occupancy', 200, 'Hospital occupancy ranking'],
            ['GET', '/api/admin/hospitals', 200, 'Admin list hospitals'],
            ['GET', '/api/admin/users', 200, 'Admin list users'],
        ];

        foreach ($adminEndpoints as [$method, $uri, $expectedStatus, $desc]) {
            $res = $this->dispatchRequest($method, $uri, null, $token);
            $isOk = $res->getStatusCode() === $expectedStatus;
            $this->logResult("{$method} {$uri}", $isOk, "{$desc} (HTTP {$res->getStatusCode()})");
        }

        $this->newLine();
        return $token;
    }

    private function checkStaffAndTenantFlow(): void
    {
        $this->comment('--- [4/4] Hospital Staff & Tenant Isolation Flow ---');

        // Find a staff user
        $staffUser = User::where('role', 'hospital_staff')->whereNotNull('hospital_id')->first();
        if (! $staffUser) {
            $this->logResult('Hospital Staff Test', false, 'No hospital staff user found in database');
            return;
        }

        // Generate a token directly for testing staff
        $staffToken = $staffUser->createToken('staff-test-token')->plainTextToken;
        $this->logResult('Staff Token Authentication', true, "Staff: {$staffUser->email} (Hospital #{$staffUser->hospital_id})");

        // 1. List patient records
        $listRes = $this->dispatchRequest('GET', '/api/patient-records', null, $staffToken);
        $listOk = $listRes->getStatusCode() === 200;
        $this->logResult('GET /api/patient-records', $listOk, "Scoped to Hospital #{$staffUser->hospital_id}");

        // 2. Create a patient record
        $createRes = $this->dispatchRequest('POST', '/api/patient-records', [
            'patient_name' => 'HealthCheck Test Patient',
            'age'          => 35,
            'gender'       => 'female',
            'phone'        => '9801122334',
            'diagnosis'    => 'Routine checkup via automated health check',
            'treatment'    => 'Observation',
        ], $staffToken);

        $createOk = $createRes->getStatusCode() === 201;
        $createdData = json_decode($createRes->getContent(), true);
        $recordId = $createdData['data']['id'] ?? null;
        $this->logResult('POST /api/patient-records', $createOk && $recordId !== null, "Created Record #{$recordId}");

        if ($recordId) {
            // 3. View record
            $showRes = $this->dispatchRequest('GET', "/api/patient-records/{$recordId}", null, $staffToken);
            $this->logResult("GET /api/patient-records/{$recordId}", $showRes->getStatusCode() === 200, 'Show patient record details');

            // 4. Update record
            $updateRes = $this->dispatchRequest('PUT', "/api/patient-records/{$recordId}", [
                'diagnosis' => 'Updated diagnosis during health check',
            ], $staffToken);
            $this->logResult("PUT /api/patient-records/{$recordId}", $updateRes->getStatusCode() === 200, 'Updated record details');

            // 5. Cross-tenant isolation check: Attempt to access from a staff of ANOTHER hospital
            $otherStaffUser = User::where('role', 'hospital_staff')
                ->where('hospital_id', '!=', $staffUser->hospital_id)
                ->whereNotNull('hospital_id')
                ->first();

            if ($otherStaffUser) {
                $otherToken = $otherStaffUser->createToken('other-staff-test-token')->plainTextToken;
                $tamperRes = $this->dispatchRequest('GET', "/api/patient-records/{$recordId}", null, $otherToken);
                $isBlocked = $tamperRes->getStatusCode() === 403;
                $this->logResult('Security Tenant Isolation (Cross-hospital access)', $isBlocked, "Hospital #{$otherStaffUser->hospital_id} staff blocked with 403 Forbidden");
                $otherStaffUser->tokens()->delete();
            }

            // 6. Delete test record
            $deleteRes = $this->dispatchRequest('DELETE', "/api/patient-records/{$recordId}", null, $staffToken);
            $this->logResult("DELETE /api/patient-records/{$recordId}", $deleteRes->getStatusCode() === 200, 'Cleaned up test record');
        }

        $staffUser->tokens()->delete();
    }

    private function dispatchRequest(string $method, string $uri, ?array $body = null, ?string $token = null)
    {
        auth()->forgetGuards();
        app()->forgetInstance('auth');

        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT'  => 'application/json',
        ];

        if ($token) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
        }

        $content = $body ? json_encode($body) : null;
        $request = Request::create($uri, $method, [], [], [], $server, $content);

        return app()->handle($request);
    }

    private function logResult(string $label, bool $success, string $detail = ''): void
    {
        if ($success) {
            $this->passed++;
            $icon = '<fg=green;options=bold>✓ PASS</>';
            $this->line("  {$icon}  <fg=white>{$label}</> <fg=gray>— {$detail}</>");
        } else {
            $this->failed++;
            $icon = '<fg=red;options=bold>✗ FAIL</>';
            $this->line("  {$icon}  <fg=red>{$label}</> <fg=yellow>— {$detail}</>");
        }
    }
}
