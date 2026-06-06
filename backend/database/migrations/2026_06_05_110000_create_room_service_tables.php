<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('room_service_menu_items')) {
            return;
        }

        Schema::create('room_service_menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('category', 30);
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'category']);
        });

        Schema::create('room_service_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->string('guest_name', 120);
            $table->string('room_number', 20)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('status', 20)->default('received');
            $table->decimal('total', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('delivered_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('booking_id');
        });

        Schema::create('room_service_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('room_service_orders')->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained('room_service_menu_items')->cascadeOnDelete();
            $table->string('item_name', 120);
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 10, 2);
            $table->timestamps();

            $table->index('order_id');
        });

        DB::table('room_service_menu_items')->insert([
            ['category' => 'Breakfast', 'name' => 'Continental Breakfast', 'description' => 'Pastries, fruit, yogurt, and choice of juice or coffee.',         'price' => 1500, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Breakfast', 'name' => 'Full English Breakfast', 'description' => 'Eggs, bacon, sausage, mushrooms, tomatoes, toast.',               'price' => 2200, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Lunch',     'name' => 'Caesar Salad',          'description' => 'Romaine, parmesan, croutons, anchovy dressing.',                    'price' => 1800, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Lunch',     'name' => 'Club Sandwich',         'description' => 'Chicken, bacon, lettuce, tomato, fries.',                            'price' => 2100, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Dinner',    'name' => 'Grilled Salmon',        'description' => 'Mashed potatoes, asparagus, lemon butter.',                          'price' => 3800, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Dinner',    'name' => 'Ribeye Steak',          'description' => 'Tender 250g cut, peppercorn sauce, veggies.',                        'price' => 4500, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Drinks',    'name' => 'House Red Wine',        'description' => 'Glass of our signature Shiraz.',                                    'price' => 1800, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Drinks',    'name' => 'Sparkling Water',       'description' => '500 ml bottle, served chilled.',                                     'price' =>  500, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Snacks',    'name' => 'Chocolate Brownie',     'description' => 'Warm, with vanilla ice cream.',                                      'price' =>  900, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'Snacks',    'name' => 'Fruit Platter',         'description' => 'Seasonal sliced fruits.',                                            'price' => 1100, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('room_service_order_items');
        Schema::dropIfExists('room_service_orders');
        Schema::dropIfExists('room_service_menu_items');
    }
};
