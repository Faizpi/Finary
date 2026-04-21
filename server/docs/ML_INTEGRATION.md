# ML Integration Plan (Saat Model Sudah Siap)

Dokumen ini menjelaskan cara menghubungkan model ML ke backend Laravel yang saat ini sudah berjalan dengan fallback rule-based.

## Arsitektur yang Sudah Disiapkan

Laravel sudah memiliki service:

- app/Services/MlGatewayService.php
- app/Services/FinancialClassifierService.php
- app/Services/SideHustleRecommendationService.php

Alur saat ini:

1. Laravel mencoba call service ML jika ML_ENABLED=true.
2. Jika service ML tidak tersedia/gagal, otomatis fallback ke rule-based.

## Environment Variable

Set di server/.env:

- ML_ENABLED=true
- ML_BASE_URL=http://127.0.0.1:8001
- ML_TIMEOUT=4

## Kontrak Endpoint ML yang Diharapkan

Service ML bisa dibuat dengan FastAPI/Flask.

### POST /classify

Request JSON:

- financial_status (string)
- economic_condition (string)
- monthly_income (number)
- monthly_expense (number)
- available_hours_per_week (integer)
- skills (array string)

Response JSON minimal:

- classification: Inflasi | Normal | Resesi
- score: number
- saving_rate: number
- recommendation_focus: array string

### POST /recommend-side-hustles

Request JSON:

- skills (array string)
- available_hours_per_week (integer)
- classification (Inflasi|Normal|Resesi)

Response JSON minimal:

- recommendations: array
    - title
    - estimated_income: { low, high }
    - channel
    - min_hours_per_week
    - matched_skills
    - match_score
    - reason

## Checklist Integrasi Produksi

1. Siapkan service ML + endpoint sesuai kontrak di atas.
2. Aktifkan ML_ENABLED=true di environment server.
3. Pastikan ML_BASE_URL bisa diakses dari server Laravel.
4. Tambahkan authentication antar service bila diperlukan (API key/internal token).
5. Tambahkan monitoring latency/error di endpoint ML.

## Best Practice

- Keep fallback aktif untuk reliability.
- Versioning model di response (contoh: model_version).
- Logging request-id untuk traceability.
- Tentukan threshold confidence jika klasifikasi low-confidence perlu fallback ke rule-based.
