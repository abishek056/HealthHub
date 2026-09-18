<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opd_queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('department');
            $table->unsignedInteger('current_token')->default(0);
            $table->unsignedInteger('estimated_wait_mins')->default(0);
            $table->enum('crowd_level', ['low', 'medium', 'high'])->default('low');
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();

            $table->index(['hospital_id', 'department']);
            $table->index('crowd_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opd_queues');
    }
};