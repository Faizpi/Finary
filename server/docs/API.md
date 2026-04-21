# Finary API Documentation

Base URL (local):

- http://127.0.0.1:8000/api

Authentication:

- Gunakan Bearer token dari endpoint login/register.
- Header: Authorization: Bearer <token>

## Health

### GET /health

Mengecek status API.

## Authentication

### POST /auth/register

Body:

- name (string, required)
- email (string, required)
- password (string, min 8, required)
- password_confirmation (string, required)

### POST /auth/login

Body:

- email (string, required)
- password (string, required)

### GET /auth/me

Butuh token.

### POST /auth/logout

Butuh token.

## Assessment

### GET /assessment/latest

Butuh token.

### POST /assessment

Butuh token.

Body:

- financial_status (string) contoh: defisit/surplus/seimbang
- economic_condition (string)
- monthly_income (number)
- monthly_expense (number)
- income_sources (array string, optional)
- financial_goal (string, optional)
- available_hours_per_week (integer)
- skills (array string, optional)

Response penting:

- classification_result.classification: Inflasi | Normal | Resesi
- classification_result.source: ml | rule-based

## Dashboard & Insight

### GET /dashboard

Butuh token.

### GET /insights/profile

Butuh token.

### GET /insights/badges

Butuh token.

### GET /insights/leaderboard

Butuh token.

## Transactions

### GET /transactions

Butuh token.

Query optional:

- type: income | expense
- month: YYYY-MM

### POST /transactions

Body:

- type (income|expense)
- category (string)
- amount (number)
- transaction_date (date, format YYYY-MM-DD)
- note (string, optional)

### PUT /transactions/{id}

Body partial diperbolehkan.

### DELETE /transactions/{id}

## Budgets

### GET /budgets

Butuh token.

### POST /budgets

Body:

- category (string)
- period (YYYY-MM, optional, default bulan ini)
- monthly_limit (number)

### PUT /budgets/{id}

Body partial diperbolehkan.

### DELETE /budgets/{id}

## Side Hustle Recommendation

### POST /recommendations/side-hustles

Butuh token.

Body (semua optional, otomatis fallback ke assessment terbaru):

- skills (array string)
- available_hours_per_week (integer)
- classification (Inflasi|Normal|Resesi)

Response:

- data.source: ml | rule-based
- data.recommendations: list rekomendasi side hustle + estimasi income

## Forum

### GET /forum/posts

Butuh token.

### POST /forum/posts

Butuh token.

Body:

- title (string)
- body (string)
- tags (array string, optional)

## Report Export

### GET /reports/transactions/export

Butuh token.

Query optional:

- month: YYYY-MM (default bulan ini)

Response:

- File CSV attachment

## Error Format

Validasi error memakai format standar Laravel:

- message
- errors (object per field)

## Contoh cURL Cepat

Login:

curl -X POST http://127.0.0.1:8000/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"email":"demo@finary.app","password":"password123"}'

Tambah transaksi:

curl -X POST http://127.0.0.1:8000/api/transactions \
 -H "Authorization: Bearer YOUR_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"type":"expense","category":"Makanan","amount":45000,"transaction_date":"2026-04-21"}'
