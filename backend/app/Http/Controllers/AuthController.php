<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        // Default new users to "staff" role_id (adjust as needed)
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role_id'  => 2, // e.g. staff role_id, change to your default
        ]);

        // Eager load role relationship
        $user->load('role');

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success('User registered successfully', [
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role_id'  => $user->role_id,
                'role'     => $user->role ? $user->role->name : null, // ✅ send role name
            ],
            'token' => $token,
        ], 201);
    }

    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Wrong email or password', null, 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success('Login successful', [
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role_id'  => $user->role_id,
                'role'     => $user->role ? $user->role->name : null, // ✅ send role name
            ],
            'token' => $token,
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success('Logged out');
    }

    // USER PROFILE
    public function user(Request $request)
    {
        $user = $request->user()->load('role');

        return $this->success('User profile retrieved successfully', [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'role_id'  => $user->role_id,
            'role'     => $user->role ? $user->role->name : null, // ✅ send role name
        ]);
    }
}
