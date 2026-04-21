<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\Budget;
use App\Models\ForumPost;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'demo@finary.app'],
            [
                'name' => 'Demo Finary',
                'password' => Hash::make('password123'),
            ]
        );

        Assessment::updateOrCreate(
            ['user_id' => $user->id],
            [
                'financial_status' => 'seimbang',
                'economic_condition' => 'kos',
                'monthly_income' => 6000000,
                'monthly_expense' => 4200000,
                'income_sources' => ['Gaji'],
                'financial_goal' => 'Dana darurat 6 bulan',
                'available_hours_per_week' => 10,
                'skills' => ['design', 'copywriting', 'social media'],
                'classification' => 'Normal',
                'metadata' => [
                    'source' => 'seed',
                ],
            ]
        );

        $today = now()->toDateString();
        $sampleTransactions = [
            ['income', 'Gaji', 6000000, $today, 'Gaji bulanan'],
            ['expense', 'Makanan', 1200000, $today, 'Kebutuhan makan'],
            ['expense', 'Transport', 450000, $today, 'Transport kerja'],
            ['expense', 'Hiburan', 350000, $today, 'Nonton dan nongkrong'],
            ['income', 'Side Hustle', 900000, $today, 'Project desain'],
        ];

        Transaction::where('user_id', $user->id)->delete();

        foreach ($sampleTransactions as [$type, $category, $amount, $date, $note]) {
            Transaction::create([
                'user_id' => $user->id,
                'type' => $type,
                'category' => $category,
                'amount' => $amount,
                'transaction_date' => $date,
                'note' => $note,
            ]);
        }

        Budget::updateOrCreate(
            [
                'user_id' => $user->id,
                'category' => 'Makanan',
                'period' => now()->format('Y-m'),
            ],
            ['monthly_limit' => 1500000]
        );

        ForumPost::updateOrCreate(
            [
                'user_id' => $user->id,
                'title' => 'Tips kontrol pengeluaran harian?',
            ],
            [
                'body' => 'Aku lagi coba batasi jajan harian. Ada template budget mingguan yang sederhana?',
                'tags' => ['budget', 'saving'],
            ]
        );
    }
}
