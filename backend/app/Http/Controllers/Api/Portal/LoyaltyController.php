<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function show(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:32',
        ]);

        $guest = Guest::with(['bookings.room'])
            ->where('phone', $data['phone'])
            ->first();

        if (!$guest) {
            return $this->error('No guest profile found for that phone number', null, 404);
        }

        $completed = $guest->bookings->where('status', 'checked_out');
        $stays = $completed->count();
        $totalSpend = (float) $completed->sum('total_price');
        $points = (int) round($totalSpend / 100);

        $tier = $this->tierFor($points);
        $next = $this->nextTier($tier);

        $history = $guest->bookings
            ->sortByDesc('check_out_date')
            ->take(8)
            ->map(fn ($b) => [
                'booking_reference' => $b->booking_reference,
                'check_in_date'     => $b->check_in_date,
                'check_out_date'    => $b->check_out_date,
                'room_number'       => $b->room?->room_number,
                'total_price'       => (float) $b->total_price,
                'status'            => $b->status,
            ])
            ->values();

        return $this->success('Loyalty profile retrieved', [
            'guest' => [
                'first_name' => $guest->first_name,
                'last_name'  => $guest->last_name,
                'loyalty_tier' => $guest->loyalty_tier,
            ],
            'points'     => $points,
            'stays'      => $stays,
            'tier'       => $tier['name'],
            'next_tier'  => $next,
            'history'    => $history,
        ]);
    }

    private function tierFor(int $points): array
    {
        return match (true) {
            $points >= 50000 => ['name' => 'Diamond',  'from' => 50000],
            $points >= 20000 => ['name' => 'Platinum', 'from' => 20000],
            $points >= 5000  => ['name' => 'Gold',     'from' => 5000],
            default          => ['name' => 'Silver',   'from' => 0],
        };
    }

    private function nextTier(array $tier): ?array
    {
        $next = match ($tier['name']) {
            'Silver'   => ['name' => 'Gold',     'from' => 5000],
            'Gold'     => ['name' => 'Platinum', 'from' => 20000],
            'Platinum' => ['name' => 'Diamond',  'from' => 50000],
            default    => null,
        };
        return $next;
    }
}
