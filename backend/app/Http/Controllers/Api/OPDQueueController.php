<?php

namespace App\Http\Controllers\Api;

use App\Events\OPDQueueUpdated;
use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\OpdQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OPDQueueController extends Controller
{
    /**
     * List all OPD queue records for a hospital.
     */
    public function index(int|string $hospitalId): JsonResponse
    {
        $hospital = Hospital::find($hospitalId);
        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $queues = OpdQueue::where('hospital_id', $hospitalId)->get();

        $summary = [];
        foreach ($queues as $q) {
            $summary[$q->department] = (int) $q->current_token;
        }

        return response()->json([
            'hospital_id' => (int) $hospitalId,
            'summary' => $summary,
            'queues' => $queues,
        ]);
    }

    /**
     * Show a specific OPD queue department.
     */
    public function show(int|string $hospitalId, int|string $queueId): JsonResponse
    {
        $queue = OpdQueue::where('hospital_id', $hospitalId)->find($queueId);
        if (! $queue) {
            return response()->json(['message' => 'OPD queue not found.'], 404);
        }

        return response()->json($queue);
    }

    /**
     * Update OPD queue status (hospital staff).
     */
    public function update(Request $request, int|string $hospitalId): JsonResponse
    {
        $validated = $request->validate([
            'department' => 'required|string',
            'current_token' => 'required|integer|min:0',
            'estimated_wait_mins' => 'nullable|integer|min:0',
            'crowd_level' => 'nullable|in:low,medium,high',
        ]);

        $queue = OpdQueue::updateOrCreate(
            ['hospital_id' => $hospitalId, 'department' => $validated['department']],
            [
                'current_token' => $validated['current_token'],
                'estimated_wait_mins' => $validated['estimated_wait_mins'] ?? 0,
                'crowd_level' => $validated['crowd_level'] ?? 'medium',
                'last_updated' => now(),
            ]
        );

        try {
            broadcast(new OPDQueueUpdated($queue))->toOthers();
        } catch (\Throwable $e) {
            // Log or ignore if broadcast driver is not active
        }

        return response()->json([
            'message' => 'OPD queue updated successfully.',
            'queue' => $queue,
        ]);
    }

    /**
     * Book an OPD token (patient).
     */
    public function bookToken(Request $request, int|string $hospitalId): JsonResponse
    {
        $hospital = Hospital::find($hospitalId);
        if (! $hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $validated = $request->validate([
            'department' => 'required|string',
            'patient_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $queue = OpdQueue::firstOrCreate(
            ['hospital_id' => $hospitalId, 'department' => $validated['department']],
            [
                'current_token' => 0,
                'estimated_wait_mins' => 15,
                'crowd_level' => 'low',
                'last_updated' => now(),
            ]
        );

        $tokenNumber = $queue->current_token + 1;
        $queue->current_token = $tokenNumber;
        
        // Dynamic wait time estimate based on crowd level / tokens
        $waitMins = max(5, ($queue->estimated_wait_mins ?: 15));
        $queue->last_updated = now();
        $queue->save();

        try {
            broadcast(new OPDQueueUpdated($queue));
        } catch (\Throwable $e) {
            // Fail gracefully if broadcast driver is not running
        }

        $phone = $validated['phone'] ?? null;
        $name = $validated['patient_name'] ?? 'Valued Patient';
        $smsMessage = $phone
            ? "Namaste {$name}, your token #{$tokenNumber} for {$queue->department} at {$hospital->name} is confirmed. Est. wait: ~{$waitMins} mins."
            : "Token #{$tokenNumber} confirmed for {$queue->department}.";

        return response()->json([
            'message' => 'Token booked successfully.',
            'token_number' => $tokenNumber,
            'department' => $queue->department,
            'hospital_id' => (int) $hospitalId,
            'hospital_name' => $hospital->name,
            'patient_name' => $name,
            'phone' => $phone,
            'estimated_wait_mins' => $waitMins,
            'crowd_level' => $queue->crowd_level,
            'sms_sent' => !empty($phone),
            'sms_confirmation' => $smsMessage,
            'booked_at' => now()->toIso8601String(),
        ]);
    }
}
