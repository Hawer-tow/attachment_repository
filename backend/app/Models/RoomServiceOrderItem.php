<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomServiceOrderItem extends Model
{
    protected $fillable = [
        'order_id', 'menu_item_id', 'item_name', 'unit_price', 'quantity', 'line_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'quantity'   => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(RoomServiceOrder::class, 'order_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(RoomServiceMenuItem::class, 'menu_item_id');
    }
}
