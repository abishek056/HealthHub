<?php

namespace App\Events;

use App\Models\Bed;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BedAvailabilityUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int    $hospital_id;
    public int    $bed_id;
    public string $ward_type;
    public int    $total_beds;
    public int    $available_beds;
    public int    $occupied_beds;
    public string $last_updated;

    public function __construct(Bed $bed)
    {
        $this->hospital_id    = (int) $bed->hospital_id;
        $this->bed_id         = (int) $bed->id;
        $this->ward_type      = $bed->ward_type;
        $this->total_beds     = (int) $bed->total_beds;
        $this->available_beds = (int) $bed->available_beds;
        $this->occupied_beds  = max(0, (int) $bed->total_beds - (int) $bed->available_beds);
        $this->last_updated   = now()->toIso8601String();
    }

    /**
     * Broadcast on the public hospital channel so all listeners
     * watching that hospital receive the update without authentication.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("hospital.{$this->hospital_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'BedAvailabilityUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'hospital_id'    => $this->hospital_id,
            'bed_id'         => $this->bed_id,
            'ward_type'      => $this->ward_type,
            'total_beds'     => $this->total_beds,
            'available_beds' => $this->available_beds,
            'occupied_beds'  => $this->occupied_beds,
            'last_updated'   => $this->last_updated,
        ];
    }
}
