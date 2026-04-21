<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->transactions()->orderByDesc('transaction_date')->orderByDesc('id');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('month')) {
            [$start, $end] = $this->monthRange((string) $request->query('month'));
            $query->whereBetween('transaction_date', [$start, $end]);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'category' => ['required', 'string', 'max:60'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        $transaction = $request->user()->transactions()->create($validated);

        return response()->json([
            'message' => 'Transaksi berhasil ditambahkan.',
            'data' => $transaction,
        ], 201);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorizeOwnership($request, $transaction);

        $validated = $request->validate([
            'type' => ['sometimes', 'in:income,expense'],
            'category' => ['sometimes', 'string', 'max:60'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'transaction_date' => ['sometimes', 'date'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        $transaction->update($validated);

        return response()->json([
            'message' => 'Transaksi berhasil diperbarui.',
            'data' => $transaction->fresh(),
        ]);
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorizeOwnership($request, $transaction);
        $transaction->delete();

        return response()->json([
            'message' => 'Transaksi dihapus.',
        ]);
    }

    private function authorizeOwnership(Request $request, Transaction $transaction): void
    {
        abort_if($transaction->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }

    private function monthRange(string $month): array
    {
        $date = Carbon::createFromFormat('Y-m', $month);

        return [
            $date->copy()->startOfMonth()->toDateString(),
            $date->copy()->endOfMonth()->toDateString(),
        ];
    }
}
