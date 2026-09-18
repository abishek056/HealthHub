<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->enum('ward_type', ['ICU', 'Emergency', 'General', 'Private']);
            $table->unsignedInteger('total_beds')->default(0);
            $table->unsignedInteger('available_beds')->default(0);
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();

            $table->index(['hospital_id', 'ward_type']);
            $table->index('available_beds');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beds');
    }
};