<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MpesaService;
use Illuminate\Http\Request;

class MpesaController extends Controller
{
    public function __construct(protected MpesaService $mpesa) {}

    // Initiate STK Push
    public function initiate(Request $request)
    {
        $request->validate([
            'phone'     => 'required|string',
            'amount'    => 'required|integer|min:1',
            'reference' => 'required|string', // e.g. booking ID
        ]);

        $result = $this->mpesa->stkPush(
            $request->phone,
            $request->amount,
            $request->reference
        );

        return response()->json($result);
    }

    // Safaricom sends payment result here
    public function callback(Request $request)
    {
        $this->mpesa->handleCallback($request->all());
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }
}