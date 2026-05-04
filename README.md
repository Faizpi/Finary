# 🚀 Finary – AI-Powered Financial Dashboard

Finary adalah platform manajemen keuangan personal cerdas yang menggunakan **Kecerdasan Buatan (AI)** untuk membantu pengguna mengklasifikasikan kondisi finansial, memprediksi arus kas bulan depan, dan memberikan rekomendasi *side hustle*. 

Proyek ini menggunakan arsitektur *monorepo* yang memisahkan Frontend, Backend, dan Microservice AI.

## 🌟 Fitur Utama
1. **AI Financial Assessment** 🤖
   Mengklasifikasikan kondisi finansial pengguna (Survival, Stable, Growth) berdasarkan *income*, pengeluaran, tabungan, dan tanggungan. (Didukung oleh `/classify`).
2. **Auto-Prediction Saldo & Risiko AI** 🔮
   Memprediksi sisa saldo di bulan depan secara otomatis berdasarkan kebiasaan transaksi, serta mendeteksi potensi risiko *cashflow*. (Didukung oleh `/predict`).
3. **Smart Side Hustle Recommendation** 💡
   Memberikan rekomendasi pekerjaan sampingan terbaik berdasarkan keahlian, pengalaman, dan waktu luang pengguna. (Didukung oleh `/recommend-side-hustle`).
4. **Comprehensive Dashboard** 📊
   Pelacakan transaksi real-time mencakup Pemasukan, Pengeluaran, Cicilan Hutang, dan Dana Darurat dengan dukungan pembuatan *Pocket* (Kantong Budget).
5. **Community & Gamification** 🏆
   Forum diskusi antar pengguna dan sistem *Leaderboard* berbasis skor keuangan.

---

## 📂 Struktur Repositori

- `client/` : Frontend aplikasi dibangun dengan **React + Vite**.
- `server/` : Backend API dibangun dengan **Laravel**.
- **ML Microservice** : Dihosting terpisah di HuggingFace (`https://raamwhy-finary-model.hf.space`).

---

## 🛠️ Cara Menjalankan Project

### 1) Backend (Laravel)
Pastikan PHP & Composer sudah terinstall dengan extension SQLite, OpenSSL, cURL, dan mbstring aktif.

1. Masuk ke direktori server:
   ```bash
   cd server
   ```
2. Salin `.env.example` ke `.env` dan pastikan konfigurasi DB SQLite benar (path absolut di Windows disarankan):
   ```ini
   DB_CONNECTION=sqlite
   DB_DATABASE=C:/Projek/Finary/server/database/database.sqlite
   ```
3. Install dependensi dan jalankan migrasi:
   ```bash
   composer install
   php artisan key:generate
   php artisan migrate:fresh --seed
   ```
4. Jalankan server lokal:
   ```bash
   php artisan serve
   ```
   *API akan berjalan di `http://127.0.0.1:8000/api`*

> **Akun Demo (dari seeder):**
> Email: `demo@finary.app` | Password: `password123`

### 2) Frontend (React)
Pastikan Node.js (versi 18+) sudah terpasang.

1. Masuk ke direktori client:
   ```bash
   cd client
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env` di dalam folder `client` dengan isi:
   ```ini
   VITE_API_URL=http://127.0.0.1:8000/api
   VITE_ML_API_URL=https://raamwhy-finary-model.hf.space
   ```
4. Jalankan server *development*:
   ```bash
   npm run dev
   ```
   *Aplikasi dapat diakses di `http://localhost:5173`*

---

## 🤖 Integrasi AI / ML

Model AI sudah terintegrasi langsung di frontend melalui `mlApiClient` (berkomunikasi dengan HuggingFace Space API).
Dokumentasi lengkap *endpoint* model dapat dilihat di `docsapifinary.json`.

---
*Dibuat oleh Tim Capstone CC26-PSU008*
