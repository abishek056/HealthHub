<?php

namespace App\Events;

use App\Models\Ambulance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AmbulanceLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int    $ambulance_id;
    public int    $hospital_id;
    public float  $latitude;
    public float  $longitude;
    public string $status;
    public string $driver_name;
    public string $vehicle_number;
    public ?string $driver_phone;
    public string $updated_at;

    public function __construct(Ambulance $ambulance)
    {
        $this->ambulance_id    = (int) $ambulance->id;
        $this->hospital_id     = (int) $ambulance->hospital_id;
        $this->latitude        = (float) $ambulance->latitude;
        $this->longitude       = (float) $ambulance->longitude;
        $this->status          = $ambulance->is_available
            ? 'available'
            : ($ambulance->is_on_call ? 'on_call' : 'dispatched');
        $this->driver_name     = $ambulance->driver_name ?? '';
        $this->vehicle_number  = $ambulance->vehicle_number ?? '';
        $this->driver_phone    = $ambulance->phone;
        $this->updated_at      = now()->toIso8601String();
    }

    /**
     * Broadcast on two channels:
     *  1. hospital.{id}     — all users watching this hospital's map
     *  2. ambulance.{id}    — anyone tracking a specific ambulance
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("hospital.{$this->hospital_id}"),
            new Channel("ambulance.{$this->ambulance_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AmbulanceLocationUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'ambulance_id'   => $this->ambulance_id,
            'hospital_id'    => $this->hospital_id,
            'latitude'       => $this->latitude,
            'longitude'      => $this->longitude,
            'status'         => $this->status,
            'driver_name'    => $this->driver_name,
            'vehicle_number' => $this->vehicle_number,
            'driver_phone'   => $this->driver_phone,
            'updated_at'     => $this->updated_at,
        ];
    }
}
