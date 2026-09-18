<?php

namespace App\Events;

use App\Models\OpdQueue;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OPDQueueUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $hospital_id;
    public string $department;
    public int $current_token;
    public int $estimated_wait_mins;
    public string $crowd_level;
    public ?string $last_updated;

    public function __construct(OpdQueue $queue)
    {
        $this->hospital_id = (int) $queue->hospital_id;
        $this->department = $queue->department;
        $this->current_token = (int) $queue->current_token;
        $this->estimated_wait_mins = (int) $queue->estimated_wait_mins;
        $this->crowd_level = $queue->crowd_level;
        $this->last_updated = $queue->last_updated?->toIso8601String() ?? now()->toIso8601String();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("hospital.{$this->hospital_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'OPDQueueUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'hospital_id' => $this->hospital_id,
            'department' => $this->department,
            'current_token' => $this->current_token,
            'estimated_wait_mins' => $this->estimated_wait_mins,
            'crowd_level' => $this->crowd_level,
            'last_updated' => $this->last_updated,
        ];
    }
}
