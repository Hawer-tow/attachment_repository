<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomServiceMenuItem extends Model
{
    protected $fillable = ['category', 'name', 'description', 'price', 'is_active'];

    protected $casts = [
        'price'    => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks'];
}
