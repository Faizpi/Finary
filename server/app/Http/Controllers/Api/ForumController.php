<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForumPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = ForumPost::query()
            ->with([
                'user:id,name',
                'replies.user:id,name',
            ])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $posts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'body' => ['required', 'string', 'max:1500'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:30'],
        ]);

        $post = $request->user()->forumPosts()->create($validated);
        $post->load('user:id,name');

        return response()->json([
            'message' => 'Postingan forum berhasil dibuat.',
            'data' => $post,
        ], 201);
    }

    public function reply(Request $request, ForumPost $post): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $reply = $post->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        $reply->load('user:id,name');

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'data' => $reply,
        ], 201);
    }
}
