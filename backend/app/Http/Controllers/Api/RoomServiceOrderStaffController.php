<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoomServiceOrderStaffController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomServiceOrder::with(['items', 'booking.guest', 'handler'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('reference')) {
            $query->where('reference', 'like', '%' . $request->query('reference') . '%');
        }

        return $this->success('Room service orders retrieved successfully', $query->paginate(20));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:' . implode(',', RoomServiceOrder::STATUSES),
        ]);

        $order = RoomServiceOrder::findOrFail($id);
        $order->status = $data['status'];

        if ($data['status'] === 'delivered' && !$order->delivered_at) {
            $order->delivered_at = now();
            $order->handled_by   = Auth::id();
        }

        if ($data['status'] === 'preparing' && !$order->handled_by) {
            $order->handled_by = Auth::id();
        }

        $order->save();

        return $this->success('Order status updated', $order->fresh()->load('items'));
    }
}
