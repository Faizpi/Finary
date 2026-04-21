<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'financial_status',
        'economic_condition',
        'monthly_income',
        'monthly_expense',
        'income_sources',
        'financial_goal',
        'available_hours_per_week',
        'skills',
        'classification',
        'metadata',
    ];

    protected $casts = [
        'monthly_income' => 'float',
        'monthly_expense' => 'float',
        'income_sources' => 'array',
        'skills' => 'array',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
