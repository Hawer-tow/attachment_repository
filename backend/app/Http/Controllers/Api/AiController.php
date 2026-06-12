<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;
use App\Models\AiFaq;

class AiController extends Controller
{
    public function __construct(private AiService $aiService) {}

    /**
     * Return FAQs filtered by the authenticated user's role.
     */
public function faqs(Request $request)
{
    $roleName = $request->user()?->role?->name ?? 'receptionist';

    $query = AiFaq::where('active', true);

    if ($roleName !== 'admin') {
        $query->where('role_id', $request->user()->role_id);
    }

    // ✅ Normalize role to string before returning
    $faqs = $query->get()->map(function ($faq) {
        return [
            'id'       => $faq->id,
            'question' => $faq->question,
            'answer'   => $faq->answer,
            'active'   => $faq->active,
            'role'     => is_string($faq->role) ? $faq->role : ($faq->role?->name ?? ''),
        ];
    });

    return response()->json([
        'success' => true,
        'data'    => $faqs,
    ]);
}


    /**
     * Query the AI service with role-based restrictions.
     */
    public function query(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|min:1|max:500',
            'faq_id' => 'nullable|integer',
        ]);

        try {
            // ✅ Normalize role to string
            $roleName = $request->user()?->role?->name ?? 'receptionist';
            $prompt   = $request->input('prompt');
            $faqId    = $request->input('faq_id');

            // Restrict scope for non-admins
            if ($roleName !== 'admin') {
                if (str_contains(strtolower($prompt), 'confidential')
                    || str_contains(strtolower($prompt), 'financial')
                ) {
                    return response()->json([
                        'success'  => false,
                        'response' => 'Access denied: insufficient role privileges.',
                    ], 403);
                }
            }

            // ✅ Pass roleName (string) into AiService
            $reply = $this->aiService->query($prompt, auth()->id(), $roleName, $faqId);

            return response()->json([
                'success'  => true,
                'response' => is_string($reply) ? $reply : json_encode($reply),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success'  => false,
                'response' => 'Unable to send prompt to AI service.',
            ], 500);
        }
    }

    /**
     * Return interaction history filtered by user.
     */
    public function interactions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $this->aiService->getHistory(auth()->id()),
        ]);
    }

    /**
     * Store a new interaction (alias for query).
     */
    public function store(Request $request)
    {
        return $this->query($request);
    }
}
