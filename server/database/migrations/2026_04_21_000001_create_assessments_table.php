<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('financial_status');
            $table->string('economic_condition');
            $table->decimal('monthly_income', 14, 2)->default(0);
            $table->decimal('monthly_expense', 14, 2)->default(0);
            $table->json('income_sources')->nullable();
            $table->string('financial_goal')->nullable();
            $table->unsignedSmallInteger('available_hours_per_week')->default(0);
            $table->json('skills')->nullable();
            $table->enum('classification', ['Inflasi', 'Normal', 'Resesi']);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
