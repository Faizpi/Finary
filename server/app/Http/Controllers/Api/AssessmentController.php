<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
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
            // 5 fields required by ML /classify
            'monthly_income'   => ['required', 'numeric', 'min:1'],
            'monthly_expense'  => ['required', 'numeric', 'min:0'],
            'actual_savings'   => ['required', 'numeric', 'min:0'],
            'budget_goal'      => ['required', 'numeric', 'min:0'],
            'emergency_fund'   => ['required', 'numeric', 'min:0'],
            // ML result passed from frontend after calling HuggingFace
            'classification'   => ['nullable', 'string', 'max:40'],
            'ml_score'         => ['nullable', 'numeric'],
            'ml_explanation'   => ['nullable', 'string', 'max:500'],
        ]);

        $assessment = $request->user()->assessments()->create([
            'monthly_income'  => $validated['monthly_income'],
            'monthly_expense' => $validated['monthly_expense'],
            'actual_savings'  => $validated['actual_savings'],
            'budget_goal'     => $validated['budget_goal'],
            'emergency_fund'  => $validated['emergency_fund'],
            'classification'  => $validated['classification'] ?? 'unknown',
            'metadata'        => [
                'ml_score'       => $validated['ml_score'] ?? null,
                'ml_explanation' => $validated['ml_explanation'] ?? null,
                'source'         => 'huggingface_ml',
            ],
        ]);

        return response()->json([
            'message' => 'Assessment tersimpan.',
            'data'    => $assessment,
        ], 201);
    }
}
