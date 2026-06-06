<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(StaySyncSeeder::class);

        $users = [
            [
                'name'  => 'StaySync Admin',
                'email' => 'admin@staysync.test',
                'role'  => 'admin',
            ],
            [
                'name'  => 'StaySync Manager',
                'email' => 'manager@staysync.test',
                'role'  => 'manager',
            ],
            [
                'name'  => 'StaySync Receptionist',
                'email' => 'receptionist@staysync.test',
                'role'  => 'receptionist',
            ],
            [
                'name'  => 'StaySync Housekeeper',
                'email' => 'housekeeper@staysync.test',
                'role'  => 'housekeeper',
            ],
        ];

        foreach ($users as $row) {
            User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name'              => $row['name'],
                    'password'          => Hash::make('password'),
                    'role'              => $row['role'],
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
