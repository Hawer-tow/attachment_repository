<?php

return [
    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'endpoint' => env('OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
        'model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),
        'temperature' => (float) env('OPENAI_TEMPERATURE', 0.7),
        'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 500),
    ],
];