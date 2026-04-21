<?php

return [
    'enabled' => env('ML_ENABLED', false),
    'base_url' => env('ML_BASE_URL', 'http://127.0.0.1:8001'),
    'timeout' => (int) env('ML_TIMEOUT', 4),
];
