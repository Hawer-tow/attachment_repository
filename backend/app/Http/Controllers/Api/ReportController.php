<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Room;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | REVENUE REPORT
    |--------------------------------------------------------------------------
    */
    public function revenue()
    {
        return $this->success('Revenue report retrieved successfully', [
            'total_revenue' => $this->totalRevenue(),
            'today_revenue' => $this->revenueForDate(Carbon::today()),
            'monthly_revenue' => $this->revenueForPeriod(
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth(),
            ),
            'yearly_revenue' => $this->revenueForPeriod(
                Carbon::now()->startOfYear(),
                Carbon::now()->endOfYear(),
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING REPORT
    |--------------------------------------------------------------------------
    */
    public function bookings()
    {
        return $this->success('Booking report retrieved successfully', [
            'total_bookings' => Booking::count(),
            'confirmed' => Booking::where('status', 'confirmed')->count(),
            'checked_in' => Booking::where('status', 'checked_in')->count(),
            'checked_out' => Booking::where('status', 'checked_out')->count(),
            'cancelled' => Booking::where('status', 'cancelled')->count(),
            'pending' => Booking::where('status', 'pending')->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | OCCUPANCY REPORT
    |--------------------------------------------------------------------------
    */
    public function occupancy()
    {
        $totalRooms = Room::where('is_active', true)->count();
        $today = Carbon::today()->toDateString();

        // Derive occupancy from bookings (not rooms.status) so it works
        // for both live check-ins and seeded/bookings created via the API.
        $occupiedRoomIds = Booking::query()
            ->where('status', '!=', 'cancelled')
            ->where('check_in_date', '<=', $today)
            ->where('check_out_date', '>', $today)
            ->pluck('room_id')
            ->unique();

        $occupiedRooms = $occupiedRoomIds->count();
        $availableRooms = max(0, $totalRooms - $occupiedRooms);

        $occupancyRate = $totalRooms > 0
            ? round(($occupiedRooms / $totalRooms) * 100, 2)
            : 0;

        return $this->success('Occupancy report retrieved successfully', [
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'available_rooms' => $availableRooms,
            'dirty_rooms' => Room::where('status', 'dirty')->count(),
            'maintenance_rooms' => Room::where('status', 'maintenance')->count(),
            'occupancy_rate' => $occupancyRate . '%',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY REVENUE ANALYTICS
    |--------------------------------------------------------------------------
    */
    public function monthlyRevenue()
    {
        $paymentRows = Payment::select(
                DB::raw('MONTH(paid_at) as month'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $bookingRows = Booking::query()
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->select(
                DB::raw('MONTH(check_in_date) as month'),
                DB::raw('SUM(total_price) as total'),
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $merged = $paymentRows->map(function ($row, $month) use ($bookingRows) {
            $bookingTotal = (float) ($bookingRows[$month]->total ?? 0);
            return [
                'month' => (int) $month,
                'total' => (float) $row->total + $bookingTotal,
            ];
        })->values();

        // Months that only have booking revenue (no payments) need to be in the result too.
        foreach ($bookingRows as $month => $row) {
            if (!$paymentRows->has($month)) {
                $merged->push([
                    'month' => (int) $month,
                    'total' => (float) $row->total,
                ]);
            }
        }

        $merged = $merged->sortBy('month')->values();

        return $this->success('Monthly revenue report retrieved successfully', $merged);
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY BOOKING ANALYTICS
    |--------------------------------------------------------------------------
    */
    public function monthlyBookings()
    {
        $bookings = Booking::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success('Monthly bookings report retrieved successfully', $bookings);
    }

    private function totalRevenue(): float
    {
        $paymentSum = (float) Payment::query()
            ->whereHas('booking', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->sum('amount');

        $bookingSum = (float) Booking::query()
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        return $paymentSum + $bookingSum;
    }

    private function revenueForDate(Carbon $date): float
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $paymentSum = (float) Payment::query()
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount');

        $bookingSum = (float) Booking::query()
            ->whereDate('check_in_date', $date->toDateString())
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        return $paymentSum + $bookingSum;
    }

    private function revenueForPeriod(Carbon $start, Carbon $end): float
    {
        $paymentSum = (float) Payment::query()
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount');

        $bookingSum = (float) Booking::query()
            ->whereBetween('check_in_date', [$start->toDateString(), $end->toDateString()])
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        return $paymentSum + $bookingSum;
    }

    /*
    |--------------------------------------------------------------------------
    | PDF EXPORT
    |--------------------------------------------------------------------------
    |
    | Returns a single PDF that mirrors the on-screen reports page. Accepts
    | ?type=full|revenue|bookings|occupancy so callers can pull just one
    | section. ?date_range=month|today|week|year drives the section title
    | and "as of" footer.
    */
    public function pdf(Request $request)
    {
        $type = $request->query('type', 'full');
        if (!in_array($type, ['full', 'revenue', 'bookings', 'occupancy'], true)) {
            $type = 'full';
        }

        $dateRange = $request->query('date_range', 'month');
        if (!in_array($dateRange, ['today', 'week', 'month', 'year'], true)) {
            $dateRange = 'month';
        }

        $monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        $data = [
            'type'              => $type,
            'date_range'        => $dateRange,
            'generated_at'      => Carbon::now()->format('d M Y, H:i'),
            'hotel'             => [
                'name'    => config('app.name', 'StaySync Hotel'),
                'tagline' => 'Management & Operations Report',
            ],
            'month_names'       => $monthNames,
        ];

        if ($type === 'full' || $type === 'revenue') {
            $data['revenue'] = [
                'today'    => $this->revenueForDate(Carbon::today()),
                'month'    => $this->revenueForPeriod(Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()),
                'year'     => $this->revenueForPeriod(Carbon::now()->startOfYear(), Carbon::now()->endOfYear()),
                'total'    => $this->totalRevenue(),
            ];
            $data['monthly_revenue'] = $this->monthlyRevenue()->getData()->data;
        }

        if ($type === 'full' || $type === 'bookings') {
            $data['bookings'] = [
                'total'        => Booking::count(),
                'confirmed'    => Booking::where('status', 'confirmed')->count(),
                'checked_in'   => Booking::where('status', 'checked_in')->count(),
                'checked_out'  => Booking::where('status', 'checked_out')->count(),
                'cancelled'    => Booking::where('status', 'cancelled')->count(),
                'pending'      => Booking::where('status', 'pending')->count(),
            ];
            $data['monthly_bookings'] = $this->monthlyBookings()->getData()->data;
        }

        if ($type === 'full' || $type === 'occupancy') {
            $totalRooms   = Room::where('is_active', true)->count();
            $today        = Carbon::today()->toDateString();
            $occupiedIds  = Booking::query()
                ->where('status', '!=', 'cancelled')
                ->where('check_in_date', '<=', $today)
                ->where('check_out_date', '>', $today)
                ->pluck('room_id')
                ->unique();
            $occupied     = $occupiedIds->count();
            $available    = max(0, $totalRooms - $occupied);
            $rate         = $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 2) : 0;

            $data['occupancy'] = [
                'total_rooms'       => $totalRooms,
                'occupied_rooms'    => $occupied,
                'available_rooms'   => $available,
                'dirty_rooms'       => Room::where('status', 'dirty')->count(),
                'maintenance_rooms' => Room::where('status', 'maintenance')->count(),
                'occupancy_rate'    => $rate . '%',
            ];
        }

        $filename = sprintf('staysync-report-%s-%s.pdf', $type, Carbon::now()->format('Ymd-His'));

        $pdf = Pdf::loadView('reports', $data)
            ->setPaper('a4', 'portrait');

        return $pdf->stream($filename);
    }
}
