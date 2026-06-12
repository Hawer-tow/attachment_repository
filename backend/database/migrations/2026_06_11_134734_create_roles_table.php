<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();        // e.g. admin, receptionist, manager, housekeeper
                $table->string('description')->nullable(); // optional description of the role
                $table->timestamps();
            });
        } else {
            Schema::table('roles', function (Blueprint $table) {
                if (!Schema::hasColumn('roles', 'name')) {
                    $table->string('name')->unique()->after('id');
                }
                if (!Schema::hasColumn('roles', 'description')) {
                    $table->string('description')->nullable()->after('name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
