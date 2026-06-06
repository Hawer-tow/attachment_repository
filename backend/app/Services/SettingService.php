<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    /**
     * Whitelist of editable keys with their default values. The frontend
     * renders this map to know which fields exist and their default shape.
     */
    public const DEFAULTS = [
        'hotel.name'              => 'StaySync Hotel',
        'hotel.address'           => '123 Moi Avenue, Nairobi, Kenya',
        'hotel.phone'             => '+254 700 000 000',
        'hotel.email'             => 'reservations@staysync.com',
        'tax.rate'                => '0.16',
        'pricing.weekend_surcharge' => '20',
        'pricing.currency'        => 'KES',
        'cancellation.grace_hours' => '24',
    ];

    public function all(): array
    {
        $stored = Setting::pluck('setting_value', 'setting_key')->toArray();
        return array_merge(self::DEFAULTS, $stored);
    }

    public function get(string $key, ?string $default = null): ?string
    {
        $value = Cache::rememberForever("setting.{$key}", function () use ($key) {
            return Setting::where('setting_key', $key)->value('setting_value');
        });

        return $value ?? $default ?? self::DEFAULTS[$key] ?? null;
    }

    public function getFloat(string $key, float $default = 0.0): float
    {
        $value = $this->get($key);
        return is_numeric($value) ? (float) $value : $default;
    }

    public function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            if (!array_key_exists($key, self::DEFAULTS)) {
                continue;
            }
            Setting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $value === null ? null : (string) $value],
            );
            Cache::forget("setting.{$key}");
        }
    }
}
