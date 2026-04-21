<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FinancialClassifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly FinancialClassifierService $classifier)
    {
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $defaultAssessmentPayload = [
            'financial_status' => 'seimbang',
            'economic_condition' => 'awal penggunaan',
            'monthly_income' => 6000000,
            'monthly_expense' => 4200000,
            'income_sources' => ['Gaji'],
            'financial_goal' => 'Bangun dana darurat 6 bulan',
            'available_hours_per_week' => 8,
            'skills' => ['communication'],
        ];

        [$user, $token] = DB::transaction(function () use ($validated, $defaultAssessmentPayload) {
            $user = User::create($validated);

            $classificationResult = $this->classifier->classify($defaultAssessmentPayload);

            $user->assessments()->create([
                ...$defaultAssessmentPayload,
                'classification' => $classificationResult['classification'],
                'metadata' => [
                    'score' => $classificationResult['score'],
                    'saving_rate' => $classificationResult['saving_rate'],
                    'source' => $classificationResult['source'],
                    'recommendation_focus' => $classificationResult['recommendation_focus'],
                    'stage' => 'onboarding',
                ],
            ]);

            $token = $user->createToken('finary-token')->plainTextToken;

            return [$user, $token];
        });

        return response()->json([
            'message' => 'Register berhasil.',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak valid.'],
            ]);
        }

        $token = $user->createToken('finary-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
