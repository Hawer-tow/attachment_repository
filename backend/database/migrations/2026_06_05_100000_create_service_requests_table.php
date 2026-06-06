<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('service_requests')) {
            return;
        }

        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->string('service_type', 50);
            $table->string('guest_name', 255);
            $table->string('room_number', 20)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 255)->nullable();
            $table->dateTime('preferred_at')->nullable();
            $table->text('details')->nullable();
            $table->string('status', 20)->default('open');
            $table->text('staff_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('service_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
