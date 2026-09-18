<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alter enum to include 'patient' and 'public'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'hospital_admin', 'hospital_staff', 'patient', 'public') NOT NULL DEFAULT 'patient'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'hospital_admin', 'hospital_staff') NOT NULL DEFAULT 'hospital_staff'");
    }
};
