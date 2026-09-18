import React, { useState } from 'react';
import { Truck, Phone, User, Hash, MapPin, Check, RefreshCw, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddAmbulanceForm({ hospitalCoords, onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    driver_name: '',
    phone: '',
    latitude: hospitalCoords?.latitude ?? 27.7056,
    longitude: hospitalCoords?.longitude ?? 85.3131,
    is_available: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        toast.success('Device GPS coordinates loaded!');
      },
      () => toast.error('Unable to retrieve GPS location.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number.trim()) {
      toast.error('Vehicle number is required.');
      return;
    }
    if (!formData.driver_name.trim()) {
      toast.error('Driver name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Contact phone is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        ...formData,
        latitude: parseFloat(formData.latitude) || hospitalCoords?.latitude || 27.7056,
        longitude: parseFloat(formData.longitude) || hospitalCoords?.longitude || 85.3131,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ambulance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Add New Ambulance</h3>
          <p className="text-xs text-slate-400">Register a new vehicle to the hospital fleet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Vehicle Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Vehicle Number</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. BA 1 KHA 1234"
            value={formData.vehicle_number}
            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Driver Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Driver Name</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Ram Bahadur"
            value={formData.driver_name}
            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Phone</span>
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. 9800000000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Initial GPS Coordinates
          </label>
          <button
            type="button"
            onClick={handleUseDeviceLocation}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40 transition-colors"
          >
            <Crosshair className="w-3 h-3" />
            Use My GPS
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Availability toggle */}
      <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
        <input
          type="checkbox"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500"
        />
        <div>
          <p className="text-xs font-bold text-white">Mark as Available</p>
          <p className="text-[10px] text-slate-400">Vehicle is ready for emergency dispatch</p>
        </div>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSubmitting ? 'Adding...' : 'Add to Fleet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
