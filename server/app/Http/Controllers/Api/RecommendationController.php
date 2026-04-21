<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SideHustleRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(private readonly SideHustleRecommendationService $recommendationService)
    {
    }

    public function sideHustles(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:40'],
            'available_hours_per_week' => ['nullable', 'integer', 'min:0', 'max:168'],
            'classification' => ['nullable', 'in:Inflasi,Normal,Resesi'],
        ]);

        $latestAssessment = $request->user()->assessments()->latest()->first();

        $payload = [
            'skills' => $validated['skills'] ?? ($latestAssessment?->skills ?? []),
            'available_hours_per_week' => $validated['available_hours_per_week']
                ?? (int) ($latestAssessment?->available_hours_per_week ?? 0),
            'classification' => $validated['classification'] ?? ($latestAssessment?->classification ?? 'Normal'),
        ];

        return response()->json([
            'data' => $this->recommendationService->recommend($payload),
        ]);
    }
}
