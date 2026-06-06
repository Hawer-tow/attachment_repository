<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomServiceOrder extends Model
{
    protected $fillable = [
        'reference', 'booking_id', 'guest_name', 'room_number', 'phone',
        'status', 'total', 'notes', 'handled_by', 'delivered_at',
    ];

    protected $casts = [
        'total'        => 'decimal:2',
        'delivered_at' => 'datetime',
    ];

    public const STATUSES      = ['received', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
    public const ACTIVE_STATUSES = ['received', 'preparing', 'on_the_way'];

    public function items(): HasMany
    {
        return $this->hasMany(RoomServiceOrderItem::class, 'order_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
