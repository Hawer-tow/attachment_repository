<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiInteraction;
use App\Services\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function index() {
        return response()->json(AiInteraction::latest()->get());
    }

    public function store(Request $request, AiService $aiService) {
        $data = $request->validate(['prompt' => 'required|string']);
        $interaction = AiInteraction::create([
            'user_id' => auth()->id(),
            'prompt' => $data['prompt'],
            'status' => 'pending',
        ]);

        $responseText = $aiService->query($data['prompt']);
        $interaction->update([
            'response' => $responseText,
            'status' => 'completed',
        ]);

        return response()->json($interaction, 201);
    }
}