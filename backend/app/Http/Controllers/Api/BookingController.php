<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Room;
use App\Services\BookingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class BookingController extends Controller
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL BOOKINGS
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        return $this->success('Bookings retrieved successfully', Booking::with(['guest', 'room', 'roomType'])->latest()->get());
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE BOOKING
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([

            'guest_id' => 'required|exists:guests,id',
            'room_id' => 'required|exists:rooms,id',
            'room_type_id' => 'required|exists:room_types,id',

            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date',

            'num_adults' => 'required|integer|min:1',
            'num_children' => 'nullable|integer|min:0',

            'source' => 'nullable|string',
            'special_requests' => 'nullable|string',
        ]);

        $booking = $this->bookingService->createBooking($validated);

        return $this->success('Booking created successfully', $booking->load(['guest', 'room', 'roomType']), 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE BOOKING
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $booking = Booking::with([
            'guest',
            'room',
            'roomType',
            'payments',
            'folioCharges'
        ])->findOrFail($id);

        return $this->success('Booking retrieved successfully', $booking);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE BOOKING
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([

            'room_id' => 'sometimes|required|exists:rooms,id',
            'room_type_id' => 'sometimes|required|exists:room_types,id',

            'check_in_date' => 'sometimes|date',
            'check_out_date' => 'sometimes|date',

            'num_adults' => 'sometimes|integer|min:1',
            'num_children' => 'nullable|integer|min:0',

            'status' => 'sometimes|in:pending,confirmed,checked_in,checked_out,cancelled,no_show',

            'special_requests' => 'nullable|string',
        ]);

        $roomId = $validated['room_id'] ?? $booking->room_id;
        $roomTypeId = $validated['room_type_id'] ?? $booking->room_type_id;
        $checkIn = $validated['check_in_date'] ?? $booking->check_in_date;
        $checkOut = $validated['check_out_date'] ?? $booking->check_out_date;

        if (!Carbon::parse($checkOut)->gt(Carbon::parse($checkIn))) {
            return $this->error('Validation failed', [
                'check_out_date' => ['The check out date must be after the check in date.'],
            ], 422);
        }

        $room = Room::findOrFail($roomId);

        if ((int) $room->room_type_id !== (int) $roomTypeId) {
            return $this->error('Validation failed', [
                'room_type_id' => ['The selected room type does not match the selected room.'],
            ], 422);
        }

        $overlap = Booking::where('id', '!=', $booking->id)
            ->where('room_id', $roomId)
            ->where('status', '!=', 'cancelled')
            ->where('check_in_date', '<', $checkOut)
            ->where('check_out_date', '>', $checkIn)
            ->exists();

        if ($overlap) {
            return $this->error('Room already booked', null, 409);
        }

        $booking->update($validated);

        return $this->success('Booking updated successfully', $booking->load(['guest', 'room', 'roomType']));
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE BOOKING
    |--------------------------------------------------------------------------
    */

    public function destroy($id)
    {
        $booking = Booking::findOrFail($id);

        $booking->delete();

        return $this->success('Booking deleted successfully');
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE ROOMS
    |--------------------------------------------------------------------------
    */

    public function availableRooms(Request $request)
    {
        $request->validate([
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date'
        ]);

        $bookedRoomIds = Booking::where('status', '!=', 'cancelled')
            ->where('check_in_date', '<', $request->check_out_date)
            ->where('check_out_date', '>', $request->check_in_date)
            ->pluck('room_id');

        $rooms = Room::with('roomType')
            ->whereNotIn('id', $bookedRoomIds)
            ->where('status', 'available')
            ->where('is_active', true)
            ->get();

        return $this->success('Available rooms retrieved successfully', $rooms);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK IN
    |--------------------------------------------------------------------------
    */

    public function checkIn($id)
    {
        $booking = Booking::findOrFail($id);

        if ($booking->status !== 'confirmed') {
            return $this->error('Only confirmed bookings can check in.');
        }

        $booking->update([
            'status' => 'checked_in',
            'actual_check_in' => now()
        ]);

        $booking->room->update([
            'status' => 'occupied'
        ]);

        return $this->success('Guest checked in successfully', $booking->load(['guest', 'room', 'roomType']));
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK OUT
    |--------------------------------------------------------------------------
    */

    public function checkOut($id)
    {
        $booking = Booking::findOrFail($id);

        if ($booking->status !== 'checked_in') {
            return $this->error('Guest is not checked in.');
        }

        $booking->update([
            'status' => 'checked_out',
            'actual_check_out' => now()
        ]);

        $booking->room->update([
            'status' => 'dirty'
        ]);

        return $this->success('Guest checked out successfully', $booking->load(['guest', 'room', 'roomType']));
    }

                    //CALENDAR
public function calendar(Request $request)
{
    $startDate = $request->query('start_date') ? Carbon::parse($request->query('start_date'))->startOfDay() : Carbon::today();
    $endDate   = $request->query('end_date')   ? Carbon::parse($request->query('end_date'))->endOfDay()   : (clone $startDate)->addDays(29)->endOfDay();

    $rooms = Room::with('roomType')
        ->where('is_active', true)
        ->orderBy('floor')
        ->orderBy('room_number')
        ->get();

    $bookings = Booking::with('guest')
        ->where(function ($q) use ($startDate, $endDate) {
            $q->where('check_in_date', '<=', $endDate)
              ->where('check_out_date', '>=', $startDate);
        })
        ->get();

    $payload = $rooms->map(function ($room) use ($bookings) {
        $roomId = $room->id;
        $roomNumber = $room->room_number;
        $roomBookings = $bookings->where('room_id', $roomId)->map(function ($b) use ($roomNumber) {
            $guestName = $b->guest
                ? trim(($b->guest->first_name ?? '') . ' ' . ($b->guest->last_name ?? ''))
                : '';
            return [
                'room_id'           => $b->room_id,
                'room_number'       => $roomNumber,
                'status'            => $b->status,
                'check_in'          => $b->check_in_date instanceof Carbon
                    ? $b->check_in_date->toDateString()
                    : substr((string) $b->check_in_date, 0, 10),
                'check_out'         => $b->check_out_date instanceof Carbon
                    ? $b->check_out_date->toDateString()
                    : substr((string) $b->check_out_date, 0, 10),
                'booking_id'        => $b->id,
                'booking_reference' => $b->booking_reference,
                'guest_name'        => $guestName !== '' ? $guestName : 'Guest',
            ];
        })->values();

        return [
            'id'        => $roomId,
            'number'    => $roomNumber,
            'floor'     => (int) $room->floor,
            'type_name' => $room->roomType->name ?? 'Untyped',
            'status'    => $room->status,
            'bookings'  => $roomBookings,
        ];
    })->values();

    $dateRange = [];
    $cursor = $startDate->copy();
    while ($cursor->lte($endDate)) {
        $dateRange[] = $cursor->toDateString();
        $cursor->addDay();
    }

    return $this->success('Booking calendar retrieved successfully', [
        'rooms'       => $payload,
        'date_range'  => $dateRange,
    ]);
}
       //INVOICE

    public function invoice(Request $request, $id)
{
    $booking = Booking::with(
        'guest',
        'room',
        'roomType',
        'payments'
    )->findOrFail($id);

    $type = $request->query('type', 'invoice');
    if (!in_array($type, ['invoice', 'receipt'], true)) {
        $type = 'invoice';
    }

    $pdf = Pdf::loadView('invoice', compact('booking', 'type'));

    $filename = ($type === 'receipt' ? 'receipt-' : 'invoice-') . $booking->booking_reference . '.pdf';

    return $pdf->stream($filename);
}
}
