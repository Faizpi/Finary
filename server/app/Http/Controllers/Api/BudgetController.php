<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Services\FinancialInsightService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function __construct(private readonly FinancialInsightService $insightService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->insightService->budgetStatus($request->user()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'max:60'],
            'period' => ['nullable', 'date_format:Y-m'],
            'monthly_limit' => ['required', 'numeric', 'min:1'],
        ]);

        $budget = $request->user()->budgets()->updateOrCreate(
            [
                'category' => $validated['category'],
                'period' => $validated['period'] ?? Carbon::now()->format('Y-m'),
            ],
            [
                'monthly_limit' => $validated['monthly_limit'],
            ]
        );

        return response()->json([
            'message' => 'Budget tersimpan.',
            'data' => $budget,
        ], 201);
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        $this->authorizeOwnership($request, $budget);

        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'max:60'],
            'period' => ['sometimes', 'date_format:Y-m'],
            'monthly_limit' => ['sometimes', 'numeric', 'min:1'],
        ]);

        $budget->update($validated);

        return response()->json([
            'message' => 'Budget diperbarui.',
            'data' => $budget->fresh(),
        ]);
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        $this->authorizeOwnership($request, $budget);
        $budget->delete();

        return response()->json([
            'message' => 'Budget dihapus.',
        ]);
    }

    private function authorizeOwnership(Request $request, Budget $budget): void
    {
        abort_if($budget->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }
}
