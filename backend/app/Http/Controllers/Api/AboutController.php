<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class AboutController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'hotel_name'  => 'Stay Sync HMS',
                'description' => 'A modern hotel management system.',
                'address'     => '123 Main Street, Nairobi, Kenya',
                'phone'       => '+254 700 000000',
                'email'       => 'info@staysync.com',
                'amenities'   => ['Free WiFi', 'Pool', 'Gym', 'Restaurant'],
                'social' => [
                    'facebook'  => 'https://facebook.com/staysync',
                    'instagram' => 'https://instagram.com/staysync',
                    'twitter'   => 'https://twitter.com/staysync',
                ],
            ],
        ]);
    }
}