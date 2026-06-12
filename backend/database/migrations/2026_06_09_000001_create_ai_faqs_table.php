<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_faqs', function (Blueprint $table) {
            // ✅ Drop the old string column if it exists
            if (Schema::hasColumn('ai_faqs', 'role')) {
                $table->dropColumn('role');
            }

            // ✅ Add foreign key to roles table
            if (!Schema::hasColumn('ai_faqs', 'role_id')) {
                $table->foreignId('role_id')
                    ->after('active')
                    ->constrained('roles')   // references roles.id
                    ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_faqs', function (Blueprint $table) {
            // ✅ Drop foreign key if it exists
            if (Schema::hasColumn('ai_faqs', 'role_id')) {
                $table->dropConstrainedForeignId('role_id');
            }

            // ✅ Restore old string column for rollback
            if (!Schema::hasColumn('ai_faqs', 'role')) {
                $table->string('role')->default('receptionist')->after('active');
            }
        });
    }
};
