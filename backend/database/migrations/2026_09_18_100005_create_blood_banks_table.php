<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blood_banks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
            $table->unsignedInteger('units_available')->default(0);
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();

            $table->unique(['hospital_id', 'blood_group']);
            $table->index('units_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blood_banks');
    }
};