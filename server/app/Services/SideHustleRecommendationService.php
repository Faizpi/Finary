<?php

namespace App\Services;

class SideHustleRecommendationService
{
    private const HUSTLE_CATALOG = [
        [
            'title' => 'Freelance Social Media Admin',
            'skills' => ['social media', 'copywriting', 'design'],
            'min_hours' => 8,
            'income_low' => 1000000,
            'income_high' => 3000000,
            'channel' => 'Freelance platform / UMKM lokal',
        ],
        [
            'title' => 'Tutor Online',
            'skills' => ['teaching', 'communication', 'math', 'english'],
            'min_hours' => 6,
            'income_low' => 800000,
            'income_high' => 2500000,
            'channel' => 'Platform kursus online',
        ],
        [
            'title' => 'Jasa Desain Konten',
            'skills' => ['design', 'canva', 'illustration'],
            'min_hours' => 6,
            'income_low' => 1200000,
            'income_high' => 4000000,
            'channel' => 'Instagram / marketplace jasa',
        ],
        [
            'title' => 'Admin Marketplace',
            'skills' => ['communication', 'sales', 'spreadsheet'],
            'min_hours' => 10,
            'income_low' => 1200000,
            'income_high' => 3500000,
            'channel' => 'UMKM dan toko online',
        ],
        [
            'title' => 'Penulis Artikel SEO',
            'skills' => ['writing', 'seo', 'research'],
            'min_hours' => 5,
            'income_low' => 700000,
            'income_high' => 3000000,
            'channel' => 'Agency content / klien direct',
        ],
        [
            'title' => 'Data Entry Project',
            'skills' => ['spreadsheet', 'detail oriented', 'typing'],
            'min_hours' => 4,
            'income_low' => 500000,
            'income_high' => 1800000,
            'channel' => 'Job board paruh waktu',
        ],
    ];

    public function __construct(private readonly MlGatewayService $mlGateway)
    {
    }

    public function recommend(array $payload): array
    {
        $mlResult = $this->mlGateway->recommendSideHustles($payload);

        if (is_array($mlResult) && isset($mlResult['recommendations']) && is_array($mlResult['recommendations'])) {
            return [
                'source' => 'ml',
                'recommendations' => $mlResult['recommendations'],
            ];
        }

        $skills = array_map('strtolower', (array) ($payload['skills'] ?? []));
        $hours = (int) ($payload['available_hours_per_week'] ?? 0);
        $classification = (string) ($payload['classification'] ?? 'Normal');

        $recommendations = array_map(function (array $item) use ($skills, $hours, $classification) {
            $matchedSkills = array_values(array_intersect($item['skills'], $skills));
            $score = count($matchedSkills) * 20;

            $score += $hours >= $item['min_hours'] ? 20 : -20;

            if ($classification === 'Resesi' && $item['min_hours'] <= 6) {
                $score += 10;
            }

            if ($classification === 'Inflasi' && in_array('seo', $item['skills'], true)) {
                $score += 5;
            }

            return [
                'title' => $item['title'],
                'estimated_income' => [
                    'low' => $item['income_low'],
                    'high' => $item['income_high'],
                ],
                'channel' => $item['channel'],
                'min_hours_per_week' => $item['min_hours'],
                'matched_skills' => $matchedSkills,
                'match_score' => $score,
                'reason' => $this->buildReason($matchedSkills, $hours, $item['min_hours']),
            ];
        }, self::HUSTLE_CATALOG);

        usort($recommendations, fn(array $a, array $b) => $b['match_score'] <=> $a['match_score']);

        return [
            'source' => 'rule-based',
            'recommendations' => array_slice($recommendations, 0, 5),
        ];
    }

    private function buildReason(array $matchedSkills, int $hours, int $minimumHours): string
    {
        $skillText = empty($matchedSkills)
            ? 'skill kamu masih bisa diadaptasi untuk role ini'
            : 'cocok dengan skill: ' . implode(', ', $matchedSkills);

        $hourText = $hours >= $minimumHours
            ? 'waktu luang kamu cukup untuk menjalankan role ini'
            : 'butuh alokasi waktu tambahan agar hasil maksimal';

        return ucfirst($skillText) . '; ' . $hourText . '.';
    }
}
