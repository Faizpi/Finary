<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinancialClassifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function __construct(private readonly FinancialClassifierService $classifier)
    {
    }

    public function latest(Request $request): JsonResponse
    {
        $assessment = $request->user()->assessments()->latest()->first();

        return response()->json([
            'data' => $assessment,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'financial_status' => ['required', 'string', 'max:40'],
            'economic_condition' => ['required', 'string', 'max:80'],
            'monthly_income' => ['required', 'numeric', 'min:0'],
            'monthly_expense' => ['required', 'numeric', 'min:0'],
            'income_sources' => ['nullable', 'array'],
            'income_sources.*' => ['string', 'max:40'],
            'financial_goal' => ['nullable', 'string', 'max:150'],
            'available_hours_per_week' => ['required', 'integer', 'min:0', 'max:168'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:40'],
        ]);

        $classificationResult = $this->classifier->classify($validated);

        $assessment = $request->user()->assessments()->create([
            ...$validated,
            'classification' => $classificationResult['classification'],
            'metadata' => [
                'score' => $classificationResult['score'],
                'saving_rate' => $classificationResult['saving_rate'],
                'source' => $classificationResult['source'],
                'recommendation_focus' => $classificationResult['recommendation_focus'],
            ],
        ]);

        return response()->json([
            'message' => 'Assessment tersimpan.',
            'classification_result' => $classificationResult,
            'data' => $assessment,
        ], 201);
    }
}
