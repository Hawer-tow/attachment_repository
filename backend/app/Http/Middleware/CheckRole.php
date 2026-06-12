<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role, string ...$roles): Response
    {
        // Log the incoming Authorization header for debugging
        \Log::info('Auth Header:', [$request->header('Authorization')]);

        // Ensure the user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
            ], 401);
        }

        // Build the list of allowed roles
        $allowedRoles = array_merge([$role], $roles);

        // ✅ Normalize to role name string
        $roleName = $request->user()?->role?->name ?? '';

        // Check if the user has one of the allowed roles
        if (!in_array($roleName, $allowedRoles, true)) {
            \Log::warning('Access denied for user ID '.$request->user()->id.' with role '.$roleName);

            return response()->json([
                'success' => false,
                'message' => 'Access denied. Your role ('.$roleName.') does not have permission.',
            ], 403);
        }

        // Allow request to proceed
        return $next($request);
    }
}
