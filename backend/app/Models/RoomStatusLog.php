<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomStatusLog extends Model
{
    protected $fillable = [
        'room_id',
        'old_status',
        'new_status',
        'changed_by',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
