<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $id;
    public int $hospital_id;
    public ?int $user_id;
    public string $token_number;
    public string $status;
    public string $updated_at;

    public function __construct(Appointment $appointment)
    {
        $this->id = (int) $appointment->id;
        $this->hospital_id = (int) $appointment->hospital_id;
        $this->user_id = $appointment->user_id ? (int) $appointment->user_id : null;
        $this->token_number = $appointment->token_number;
        $this->status = $appointment->status;
        $this->updated_at = $appointment->updated_at?->toIso8601String() ?? now()->toIso8601String();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("hospital.{$this->hospital_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AppointmentStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->id,
            'hospital_id' => $this->hospital_id,
            'user_id' => $this->user_id,
            'token_number' => $this->token_number,
            'status' => $this->status,
            'updated_at' => $this->updated_at,
        ];
    }
}
