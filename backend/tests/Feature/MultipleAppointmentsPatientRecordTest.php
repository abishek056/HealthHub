<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultipleAppointmentsPatientRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_multiple_completed_appointments_create_distinct_patient_records(): void
    {
        $hospital = Hospital::factory()->create([
            'name'      => 'Nepal Central Hospital',
            'is_active' => true,
        ]);

        $staff = User::factory()->create([
            'role'        => 'hospital_admin',
            'hospital_id' => $hospital->id,
        ]);

        $patient = User::factory()->create([
            'role'  => 'patient',
            'name'  => 'Sunil Shrestha',
            'phone' => '9841000001',
            'email' => 'sunil@example.com',
        ]);

        // Create 2 distinct appointments in the same hospital for the same patient
        $apt1 = Appointment::create([
            'user_id'          => $patient->id,
            'hospital_id'      => $hospital->id,
            'patient_name'     => $patient->name,
            'patient_phone'    => $patient->phone,
            'patient_email'    => $patient->email,
            'department'       => 'ENT',
            'doctor_name'      => 'Dr. KC',
            'appointment_date' => now()->toDateString(),
            'time_slot'        => '09:00 AM',
            'token_number'     => 'ENT-001',
            'status'           => 'confirmed',
            'symptoms'         => 'Sore throat and fever',
        ]);

        $apt2 = Appointment::create([
            'user_id'          => $patient->id,
            'hospital_id'      => $hospital->id,
            'patient_name'     => $patient->name,
            'patient_phone'    => $patient->phone,
            'patient_email'    => $patient->email,
            'department'       => 'Orthopedics',
            'doctor_name'      => 'Dr. Sharma',
            'appointment_date' => now()->addDay()->toDateString(),
            'time_slot'        => '11:00 AM',
            'token_number'     => 'ORT-002',
            'status'           => 'confirmed',
            'symptoms'         => 'Lower back pain',
        ]);

        // Complete Appointment 1
        $res1 = $this->actingAs($staff)->putJson("/api/appointments/{$apt1->id}/status", [
            'status'    => 'completed',
            'diagnosis' => 'Acute Viral Pharyngitis',
            'treatment' => 'Paracetamol 500mg TID, Warm salt gargles for 5 days',
            'age'       => 28,
            'gender'    => 'male',
        ]);

        $res1->assertStatus(200);

        // Verify Record 1 was created
        $this->assertDatabaseHas('patient_records', [
            'hospital_id'    => $hospital->id,
            'appointment_id' => $apt1->id,
            'user_id'        => $patient->id,
            'diagnosis'      => 'Acute Viral Pharyngitis',
        ]);

        // Complete Appointment 2
        $res2 = $this->actingAs($staff)->putJson("/api/appointments/{$apt2->id}/status", [
            'status'    => 'completed',
            'diagnosis' => 'Lumbar Muscle Strain',
            'treatment' => 'Ibuprofen 400mg PRN, Physiotherapy exercises',
            'age'       => 28,
            'gender'    => 'male',
        ]);

        $res2->assertStatus(200);

        // Verify BOTH records exist in patient_records and Appointment 1 was NOT overwritten!
        $this->assertEquals(2, PatientRecord::where('hospital_id', $hospital->id)->where('user_id', $patient->id)->count());

        $this->assertDatabaseHas('patient_records', [
            'hospital_id'    => $hospital->id,
            'appointment_id' => $apt1->id,
            'diagnosis'      => 'Acute Viral Pharyngitis',
            'treatment'      => 'Paracetamol 500mg TID, Warm salt gargles for 5 days',
        ]);

        $this->assertDatabaseHas('patient_records', [
            'hospital_id'    => $hospital->id,
            'appointment_id' => $apt2->id,
            'diagnosis'      => 'Lumbar Muscle Strain',
            'treatment'      => 'Ibuprofen 400mg PRN, Physiotherapy exercises',
        ]);

        // Verify Hospital Staff Patient Records endpoint returns both records with appointment context
        $staffRecordsRes = $this->actingAs($staff)->getJson('/api/patient-records');
        $staffRecordsRes->assertStatus(200);
        $recordsData = $staffRecordsRes->json('data');
        $this->assertCount(2, $recordsData);

        // Verify Patient Medical Records endpoint returns both records for the patient
        $patientRecordsRes = $this->actingAs($patient)->getJson('/api/my-medical-records');
        $patientRecordsRes->assertStatus(200);
        $patientData = $patientRecordsRes->json('data');
        $this->assertCount(2, $patientData);

        // Verify re-completing / editing Appointment 1 updates only Appointment 1's record
        $reUpdateRes = $this->actingAs($staff)->putJson("/api/appointments/{$apt1->id}/status", [
            'status'    => 'completed',
            'diagnosis' => 'Acute Viral Pharyngitis (Resolved)',
            'treatment' => 'Completed course, continue hydration',
        ]);
        $reUpdateRes->assertStatus(200);

        $this->assertEquals(2, PatientRecord::where('hospital_id', $hospital->id)->where('user_id', $patient->id)->count());
        $this->assertDatabaseHas('patient_records', [
            'hospital_id'    => $hospital->id,
            'appointment_id' => $apt1->id,
            'diagnosis'      => 'Acute Viral Pharyngitis (Resolved)',
        ]);
        $this->assertDatabaseHas('patient_records', [
            'hospital_id'    => $hospital->id,
            'appointment_id' => $apt2->id,
            'diagnosis'      => 'Lumbar Muscle Strain',
        ]);
    }
}
