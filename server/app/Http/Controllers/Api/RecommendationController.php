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
            'experience_level' => ['nullable', 'string', 'max:40'],
            'interest_category' => ['nullable', 'string', 'max:80'],
            'available_hours_per_week' => ['nullable', 'integer', 'min:0', 'max:168'],
            'classification' => ['nullable', 'in:survival,stable,growth'],
        ]);

        $latestAssessment = $request->user()->assessments()->latest()->first();
        $skills = $validated['skills'] ?? ($latestAssessment?->skills ?? []);

        $payload = [
            'experience_level' => $validated['experience_level'] ?? 'Beginner',
            'interest_category' => $validated['interest_category'] ?? $this->inferInterestCategory($skills),
            'available_hours_per_week' => $validated['available_hours_per_week']
                ?? (int) ($latestAssessment?->available_hours_per_week ?? 10),
            'skills' => $skills,
            'classification' => $validated['classification'] ?? ($latestAssessment?->classification ?? 'stable'),
        ];

        return response()->json([
            'data' => $this->recommendationService->recommend($payload),
        ]);
    }

    private function inferInterestCategory(array $skills): string
    {
        $skillText = strtolower(implode(' ', $skills));

        return match (true) {
            str_contains($skillText, 'design') => 'Graphic Design',
            str_contains($skillText, 'seo') || str_contains($skillText, 'writing') => 'SEO',
            str_contains($skillText, 'teach') => 'Teaching / Tutoring',
            str_contains($skillText, 'social') => 'Social Media Management',
            default => 'App Development',
        };
    }
}
