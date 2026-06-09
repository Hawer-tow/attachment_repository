<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiService
{
    protected string $apiKey;
    protected string $endpoint;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('ai.api_key');
        $this->endpoint = config('ai.endpoint');
        $this->model = config('ai.model', 'gpt-4o-mini');
    }

    public function query(string $prompt): string
    {
        $response = Http::withToken($this->apiKey)
            ->post($this->endpoint, [
                'model' => $this->model,
                'input' => $prompt,
            ]);

        return $response->json('output.0.content.0.text', '');
    }
}