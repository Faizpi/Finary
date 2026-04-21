# Finary Monorepo

Monorepo ini berisi:

- client: React + Vite
- server: Laravel API

## 1) Menjalankan Backend (Laravel)

Masuk ke folder server:

cd server

Pastikan extension PHP aktif:

- openssl
- curl
- fileinfo
- mbstring
- pdo_sqlite
- sqlite3

Pastikan nilai `DB_DATABASE` di `server/.env` menunjuk ke path absolut file sqlite Anda.
Contoh:

- DB_DATABASE=C:/Projek/Finary/server/database/database.sqlite

Lalu jalankan:

composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve

Backend berjalan di:

- http://127.0.0.1:8000
- API base: http://127.0.0.1:8000/api

Akun demo:

- email: demo@finary.app
- password: password123

## 2) Menjalankan Frontend (React)

Masuk ke folder client:

cd client
npm install

Buat file .env berdasarkan .env.example:

- VITE_API_URL=http://127.0.0.1:8000/api

Jalankan:

npm run dev

Frontend default di:

- http://127.0.0.1:5173

## 3) Dokumentasi API

Lihat:

- server/docs/API.md

## 4) Integrasi Model ML Nanti

Saat model belum ada, backend otomatis pakai fallback rule-based.
Jika model sudah siap, lihat:

- server/docs/ML_INTEGRATION.md

## 5) Storyset Assets

Frontend menggunakan ilustrasi dari Storyset (Freepik) via URL SVG.
Tetap perhatikan atribusi lisensi sesuai ketentuan Storyset/Freepik.
