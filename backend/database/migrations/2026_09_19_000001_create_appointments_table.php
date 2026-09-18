<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('patient_name');
            $table->string('patient_phone', 25);
            $table->string('patient_email')->nullable();
            $table->string('department');
            $table->string('doctor_name')->nullable();
            $table->date('appointment_date');
            $table->string('time_slot');
            $table->string('token_number')->unique();
            $table->enum('status', ['confirmed', 'pending', 'completed', 'cancelled'])->default('confirmed');
            $table->text('symptoms')->nullable();
            $table->timestamps();

            $table->index(['hospital_id', 'appointment_date']);
            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
