<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'service_type'  => 'required|in:' . implode(',', ServiceRequest::SERVICE_TYPES),
            'guest_name'    => 'required|string|max:255',
            'room_number'   => 'nullable|string|max:20',
            'phone'         => 'nullable|string|max:32',
            'email'         => 'nullable|email|max:255',
            'preferred_at'  => 'nullable|date',
            'details'       => 'nullable|string|max:2000',
        ]);

        $request->merge(['reference' => 'SR-' . strtoupper(uniqid())]);

        $serviceRequest = ServiceRequest::create([
            'reference'    => $request->input('reference'),
            'service_type' => $data['service_type'],
            'guest_name'   => $data['guest_name'],
            'room_number'  => $data['room_number'] ?? null,
            'phone'        => $data['phone'] ?? null,
            'email'        => $data['email'] ?? null,
            'preferred_at' => $data['preferred_at'] ?? null,
            'details'      => $data['details'] ?? null,
            'status'       => 'open',
        ]);

        return $this->success('Concierge request received', $serviceRequest, 201);
    }
}
