<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'phone' => '0710735860',
                'email' => 'support@staysync.co.ke',
                'location' => 'Nakuru, Kenya',
                'support_hours' => '24/7 Operations Support',
            ],
        ]);
    }

    public function store(ContactRequest $request)
    {
        try {
            Mail::to(config('mail.admin_address'))->send(
                new ContactMail($request->validated())
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Message sent successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to send message. Please try again.',
            ], 500);
        }
    }
}
