<?php

namespace App\Observers;

use App\Models\Room;
use App\Models\RoomStatusLog;
use Illuminate\Support\Facades\Auth;

class RoomObserver
{
    public function updated(Room $room): void
    {
        if (!$room->wasChanged('status')) {
            return;
        }

        $newStatus = $room->status;
        $oldStatus = $room->getOriginal('status');

        if ($oldStatus === $newStatus) {
            return;
        }

        RoomStatusLog::create([
            'room_id'    => $room->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => Auth::id(),
            'changed_at' => now(),
        ]);
    }
}
