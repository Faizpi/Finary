<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlGatewayService
{
    public function classifyAssessment(array $payload): ?array
    {
        if (!config('ml.enabled')) {
            return null;
        }

        return $this->post('/classify', $payload);
    }

    public function recommendSideHustles(array $payload): ?array
    {
        if (!config('ml.enabled')) {
            return null;
        }

        return $this->post('/recommend-side-hustles', $payload);
    }

    private function post(string $path, array $payload): ?array
    {
        try {
            $response = Http::timeout(config('ml.timeout'))
                ->acceptJson()
                ->post(rtrim(config('ml.base_url'), '/') . $path, $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('ML request failed', [
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Throwable $exception) {
            Log::warning('ML service unreachable, using fallback', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
