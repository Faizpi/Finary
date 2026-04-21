<?php

namespace App\Services;

class FinancialClassifierService
{
    public function __construct(private readonly MlGatewayService $mlGateway)
    {
    }

    public function classify(array $payload): array
    {
        $mlResult = $this->mlGateway->classifyAssessment($payload);

        if (
            is_array($mlResult)
            && isset($mlResult['classification'])
            && in_array($mlResult['classification'], ['Inflasi', 'Normal', 'Resesi'], true)
        ) {
            return [
                'classification' => $mlResult['classification'],
                'score' => (float) ($mlResult['score'] ?? 0),
                'saving_rate' => (float) ($mlResult['saving_rate'] ?? 0),
                'source' => 'ml',
                'recommendation_focus' => $mlResult['recommendation_focus'] ?? [],
            ];
        }

        return $this->classifyByRules($payload);
    }

    private function classifyByRules(array $payload): array
    {
        $income = (float) ($payload['monthly_income'] ?? 0);
        $expense = (float) ($payload['monthly_expense'] ?? 0);
        $status = strtolower((string) ($payload['financial_status'] ?? ''));
        $hours = (int) ($payload['available_hours_per_week'] ?? 0);
        $skills = is_array($payload['skills'] ?? null) ? $payload['skills'] : [];

        $savingRate = $income > 0 ? ($income - $expense) / $income : -1;

        $score = 50;

        if ($savingRate >= 0.30) {
            $score += 20;
        } elseif ($savingRate >= 0.10) {
            $score += 8;
        } elseif ($savingRate < 0) {
            $score -= 20;
        }

        if ($status === 'surplus') {
            $score += 8;
        }

        if ($status === 'defisit') {
            $score -= 12;
        }

        if ($hours >= 12) {
            $score += 4;
        }

        if (count($skills) >= 3) {
            $score += 4;
        }

        if ($score >= 70) {
            $classification = 'Inflasi';
            $focus = [
                'Optimalkan investasi bertahap',
                'Naikkan target tabungan dan emergency fund',
            ];
        } elseif ($score >= 45) {
            $classification = 'Normal';
            $focus = [
                'Jaga rasio pengeluaran di bawah 70% pemasukan',
                'Bangun disiplin budgeting per kategori',
            ];
        } else {
            $classification = 'Resesi';
            $focus = [
                'Prioritaskan pengeluaran esensial',
                'Cari peluang income tambahan jangka pendek',
            ];
        }

        return [
            'classification' => $classification,
            'score' => $score,
            'saving_rate' => round($savingRate * 100, 2),
            'source' => 'rule-based',
            'recommendation_focus' => $focus,
        ];
    }
}
