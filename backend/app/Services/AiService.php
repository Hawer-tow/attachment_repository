<?php

namespace App\Services;

use App\Models\AiFaq;
use App\Models\AiInteraction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    public function query(string $prompt, ?int $userId = null, ?string $roleName = 'receptionist', ?int $faqId = null): array
    {
        // 🔎 If faqId is provided, fetch FAQ directly by ID
        if ($faqId) {
            $faq = AiFaq::where('active', 1)
                ->where('id', $faqId)
                ->when($roleName !== 'admin', fn($q) => $q->where('role', $roleName))
                ->first();

            if ($faq) {
                $answer = trim($faq->answer);

                if ($userId) {
                    AiInteraction::create([
                        'user_id'  => $userId,
                        'prompt'   => $prompt,
                        'response' => $answer,
                        'model'    => 'faq',
                        'faq_used' => true,
                    ]);
                }

                return [
                    'success' => true,
                    'data'    => [
                        'answer'    => $answer,
                        'faq_count' => 1,
                    ],
                ];
            }
        }

        // 🔎 Filter FAQs by role for context
        $faqs = $this->findRelevantFaqs($prompt, $roleName);

        // ✅ Fallback: check for exact FAQ match by question text
        $faq = AiFaq::where('active', 1)
            ->where('question', trim($prompt))
            ->when($roleName !== 'admin', fn($q) => $q->where('role', $roleName))
            ->first();

        if ($faq) {
            $answer = trim($faq->answer);

            if ($userId) {
                AiInteraction::create([
                    'user_id'  => $userId,
                    'prompt'   => $prompt,
                    'response' => $answer,
                    'model'    => 'faq',
                    'faq_used' => true,
                ]);
            }

            return [
                'success' => true,
                'data'    => [
                    'answer'    => $answer,
                    'faq_count' => $faqs->count(),
                ],
            ];
        }

        // Restrict sensitive prompts for non-admins
        if ($roleName !== 'admin' && $this->isSensitivePrompt($prompt)) {
            return [
                'success' => false,
                'message' => 'Access denied: insufficient role privileges.',
            ];
        }

        $faqContext = $this->buildFaqContext($faqs);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->getApiKey(),
                'Content-Type'  => 'application/json',
            ])->post($this->getEndpoint(), [
                'model'       => $this->getModel(),
                'temperature' => $this->getTemperature(),
                'max_tokens'  => $this->getMaxTokens(),
                'messages'    => [
                    [
                        'role'    => 'system',
                        'content' => "You are a helpful hotel concierge assistant. Use the FAQ information below when relevant.\n\n{$faqContext}",
                    ],
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

            $data = $response->json();

            Log::debug('AI raw response', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'json'   => $data,
            ]);

            if ($response->failed()) {
                $message = $data['error']['message'] ?? 'AI provider request failed.';
                return ['success' => false, 'message' => $message];
            }

            $answer = $this->parseAiAnswer($data);

            if ($answer === '') {
                $message = $data['error']['message'] ?? 'Empty AI response from provider.';
                return ['success' => false, 'message' => $message];
            }

            if ($userId) {
                AiInteraction::create([
                    'user_id'  => $userId,
                    'prompt'   => $prompt,
                    'response' => $answer,
                    'model'    => $this->getModel(),
                    'faq_used' => $faqs->isNotEmpty(),
                ]);
            }

            return [
                'success' => true,
                'data'    => [
                    'answer'    => $answer,
                    'faq_count' => $faqs->count(),
                ],
            ];
        } catch (\Throwable $e) {
            Log::error('AI query failed', ['exception' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Unable to send prompt to AI service.'];
        }
    }

    private function parseAiAnswer(array $data): string
    {
        if (isset($data['choices'][0]['message']['content'])) {
            return trim($data['choices'][0]['message']['content']);
        }

        if (isset($data['choices'][0]['text'])) {
            return trim($data['choices'][0]['text']);
        }

        return '';
    }

    private function matchExactFaq(string $prompt, $faqs)
    {
        foreach ($faqs as $faq) {
            if (strcasecmp(trim($prompt), trim($faq->question)) === 0) {
                return $faq;
            }
        }
        return null;
    }

    private function findRelevantFaqs(string $prompt, ?string $roleName = 'receptionist')
    {
        $keywords = array_filter(array_map('trim', explode(' ', strtolower($prompt))));
        Log::info('FAQ search', ['role' => $roleName, 'keywords' => $keywords]);

        return AiFaq::where('active', 1)
            ->when($roleName !== 'admin', fn($q) => $q->where('role', $roleName))
            ->where(function ($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('question', 'LIKE', "%{$keyword}%")
                          ->orWhere('answer', 'LIKE', "%{$keyword}%");
                }
            })
            ->limit(4)
            ->get();
    }

    private function buildFaqContext($faqs): string
    {
        if ($faqs->isEmpty()) {
            return '';
        }

        return $faqs
            ->map(fn ($faq) => "Q: {$faq->question}\nA: {$faq->answer}")
            ->implode("\n\n");
    }

    public function getAllFaqs(?string $roleName = null)
    {
        $query = AiFaq::where('active', 1);
        if ($roleName && $roleName !== 'admin') {
            $query->where('role', $roleName);
        }
        
        return $query->get()->map(function ($faq) {
    $faq->role = is_string($faq->role) ? $faq->role : ($faq->role?->name ?? '');
    return $faq;
});

    }

    public function getHistory(int $userId)
    {
        return AiInteraction::where('user_id', $userId)
    ->latest()
    ->limit(20)
    ->get()
    ->map(function ($interaction) {
        return [
            'id'        => $interaction->id,
            'prompt'    => $interaction->prompt,
            'answer'    => $interaction->response, // ✅ use 'answer'
            'model'     => $interaction->model,
            'faq_used'  => $interaction->faq_used,
            'created_at'=> $interaction->created_at,
        ];
    });

    }

    private function getApiKey(): string
    {
        return env('OPENROUTER_API_KEY') ?: env('OPENAI_API_KEY');
    }

    private function getEndpoint(): string
    {
        if (env('OPENROUTER_API_KEY')) {
            return env('OPENROUTER_ENDPOINT', 'https://openrouter.ai/api/v1/chat/completions');
        }

        return env('OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions');
    }

    private function getModel(): string
    {
        if (env('OPENROUTER_API_KEY')) {
            return env('OPENROUTER_MODEL', 'gpt-3o-mini');
        }

        return env('OPENAI_MODEL', 'gpt-3.5-turbo');
    }

    private function getTemperature(): float
    {
        return (float) env('AI_TEMPERATURE', 0.7);
    }

    private function getMaxTokens(): int
    {
        return (int) env('AI_MAX_TOKENS', 500);
    }

    /**
     * ✅ Helper: restrict sensitive prompts for non-admins
     */
    private function isSensitivePrompt(string $prompt): bool
    {
        $restricted = ['confidential', 'financial', 'salary', 'admin-only'];
        foreach ($restricted as $word) {
            if (stripos($prompt, $word) !== false) {
                return true;
            }
        }
        return false;
    }
}
