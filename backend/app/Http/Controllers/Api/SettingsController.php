<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(private SettingService $settings) {}

    public function index()
    {
        return $this->success('Settings retrieved successfully', [
            'values'   => $this->settings->all(),
            'defaults' => SettingService::DEFAULTS,
        ]);
    }

    public function update(Request $request)
    {
        $payload = $request->validate([
            'hotel.name'                 => 'sometimes|required|string|max:255',
            'hotel.address'              => 'sometimes|required|string|max:500',
            'hotel.phone'                => 'sometimes|required|string|max:32',
            'hotel.email'                => 'sometimes|required|email|max:255',
            'tax.rate'                   => 'sometimes|required|numeric|min:0|max:1',
            'pricing.weekend_surcharge'  => 'sometimes|required|numeric|min:0',
            'pricing.currency'           => 'sometimes|required|string|max:8',
            'cancellation.grace_hours'   => 'sometimes|required|integer|min:0|max:720',
        ]);

        $this->settings->setMany($payload);

        return $this->success('Settings updated successfully', [
            'values' => $this->settings->all(),
        ]);
    }
}
