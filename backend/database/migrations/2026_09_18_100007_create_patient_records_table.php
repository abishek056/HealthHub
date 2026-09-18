<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('patient_name');
            $table->unsignedTinyInteger('age');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('phone', 20)->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('hospital_id');
            $table->index('created_by');
            $table->index('patient_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_records');
    }
};