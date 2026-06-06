<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'q'      => 'required|string|min:1|max:255',
            'limit'  => 'nullable|integer|min:1|max:25',
        ]);

        $q = trim($data['q']);
        $limit = $data['limit'] ?? 8;
        $needle = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';

        $guests = Guest::query()
            ->with(['bookings.room'])
            ->where(function ($w) use ($needle) {
                $w->where('first_name', 'like', $needle)
                    ->orWhere('last_name', 'like', $needle)
                    ->orWhere('email', 'like', $needle)
                    ->orWhere('phone', 'like', $needle)
                    ->orWhere('id_number', 'like', $needle);
            })
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => [
                'type'    => 'guest',
                'id'      => $g->id,
                'label'   => trim(($g->first_name ?? '') . ' ' . ($g->last_name ?? '')) ?: 'Guest',
                'sub'     => collect([$g->email, $g->phone])->filter()->implode(' · '),
                'stays'   => $g->bookings->count(),
                'last_booking_reference' => optional($g->bookings->sortByDesc('check_in_date')->first())->booking_reference,
            ])
            ->values();

        $bookings = Booking::with(['guest', 'room'])
            ->where(function ($w) use ($needle) {
                $w->where('booking_reference', 'like', $needle)
                    ->orWhereHas('guest', fn ($g) => $g
                        ->where('first_name', 'like', $needle)
                        ->orWhere('last_name', 'like', $needle)
                        ->orWhere('phone', 'like', $needle)
                        ->orWhere('email', 'like', $needle))
                    ->orWhereHas('room', fn ($r) => $r->where('room_number', 'like', $needle));
            })
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn ($b) => [
                'type'      => 'booking',
                'id'        => $b->id,
                'label'     => $b->booking_reference,
                'sub'       => collect([
                    trim(($b->guest->first_name ?? '') . ' ' . ($b->guest->last_name ?? '')),
                    'Room ' . ($b->room->room_number ?? '—'),
                    $b->check_in_date . ' → ' . $b->check_out_date,
                ])->filter()->implode(' · '),
                'status'    => $b->status,
            ])
            ->values();

        $rooms = Room::with('roomType')
            ->where(function ($w) use ($needle) {
                $w->where('room_number', 'like', $needle)
                    ->orWhereHas('roomType', fn ($t) => $t->where('name', 'like', $needle));
            })
            ->orderBy('room_number')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'type'    => 'room',
                'id'      => $r->id,
                'label'   => 'Room ' . $r->room_number,
                'sub'     => collect([optional($r->roomType)->name, 'Floor ' . $r->floor])->filter()->implode(' · '),
                'status'  => $r->status,
            ])
            ->values();

        return $this->success('Search results', [
            'query' => $q,
            'guests'   => $guests,
            'bookings' => $bookings,
            'rooms'    => $rooms,
            'total'    => $guests->count() + $bookings->count() + $rooms->count(),
        ]);
    }
}
