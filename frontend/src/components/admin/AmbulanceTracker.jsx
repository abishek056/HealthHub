import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { Truck, MapPin, Phone, Radio, Check, RefreshCw, Crosshair, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AmbulanceTracker({
  ambulances = [],
  hospitalCoords,
  onUpdateLocation,
  onDeleteAmbulance,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    is_available: true,
    is_on_call: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const hasValidToken = Boolean(MAPBOX_CONFIG.accessToken && MAPBOX_CONFIG.accessToken.startsWith('pk.'));

  // Initialize selected ambulance with first one
  useEffect(() => {
    if (ambulances.length > 0 && !selectedAmbulance) {
      handleSelectAmbulance(ambulances[0]);
    }
  }, [ambulances]);

  const handleSelectAmbulance = (amb) => {
    setSelectedAmbulance(amb);
    setFormData({
      latitude: amb.latitude ?? hospitalCoords?.latitude ?? 27.705,
      longitude: amb.longitude ?? hospitalCoords?.longitude ?? 85.314,
      is_available: amb.is_available ?? true,
      is_on_call: amb.is_on_call ?? false,
    });

    if (mapRef.current && amb.latitude && amb.longitude) {
      mapRef.current.flyTo({
        center: [amb.longitude, amb.latitude],
        zoom: 14,
        essential: true,
      });
    }
  };

  // Setup Mapbox GL map
  useEffect(() => {
    if (!hasValidToken || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    const initialCenter = hospitalCoords
      ? [hospitalCoords.longitude, hospitalCoords.latitude]
      : MAPBOX_CONFIG.defaultCenter;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_CONFIG.style || 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: 12,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Click on map to pick coordinates for selected ambulance
    map.on('click', (e) => {
      setFormData((prev) => ({
        ...prev,
        latitude: parseFloat(e.lngLat.lat.toFixed(6)),
        longitude: parseFloat(e.lngLat.lng.toFixed(6)),
      }));
      toast.success('Coordinates pinned from map click!');
    });

    return () => {
      map.remove();
    };
  }, [hasValidToken, hospitalCoords]);

  // Update map markers when ambulances change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    ambulances.forEach((amb) => {
      if (!amb.latitude || !amb.longitude) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform';
      el.innerHTML = `
        <div class="relative flex items-center justify-center p-2 rounded-full ${
          amb.is_available ? 'bg-emerald-600' : 'bg-red-600'
        } text-slate-900 shadow-xl border-2 border-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
          </svg>
        </div>
      `;

      el.addEventListener('click', () => {
        handleSelectAmbulance(amb);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([amb.longitude, amb.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(`
            <div class="p-1 text-slate-900 font-sans">
              <p class="font-bold text-xs">${amb.vehicle_number || 'Ambulance'}</p>
              <p class="text-[11px] text-gray-600">${amb.driver_name || 'Driver'}</p>
              <p class="text-[10px] font-bold ${amb.is_available ? 'text-green-600' : 'text-red-600'}">
                ${amb.is_available ? 'Available' : 'Busy / On Call'}
              </p>
            </div>
          `)
        )
        .addTo(mapRef.current);

      markersRef.current[amb.id] = marker;
    });
  }, [ambulances]);

  // Use current browser device GPS
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        }
        toast.success('Loaded your device current GPS coordinates!');
      },
      () => {
        toast.error('Unable to retrieve device GPS location.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAmbulance) return;

    if (!formData.latitude || !formData.longitude) {
      toast.error('Latitude and Longitude are required.');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateLocation(selectedAmbulance.id, {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        is_available: formData.is_available,
        is_on_call: formData.is_on_call,
      });
      toast.success(`${selectedAmbulance.vehicle_number || 'Ambulance'} location updated!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update ambulance location.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Column (2 spans) */}
      <div className="lg:col-span-2 bg-white border border-[#c8eedc] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
        <div className="p-4 border-b border-[#c8eedc] bg-[#f0faf5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-sm font-bold text-slate-900">Live Fleet GPS Map</span>
          </div>
          <span className="text-xs text-slate-500">Click map to pin new coordinates</span>
        </div>

        <div className="flex-1 relative bg-[#fbfdfc]">
          {hasValidToken ? (
            <div ref={mapContainerRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
              <MapPin className="w-10 h-10 text-red-500/50" />
              <p className="text-sm font-semibold text-slate-900">GPS Map Canvas</p>
              <p className="text-xs max-w-sm">
                Mapbox token is optional. You can enter or update latitude and longitude manually in the form on the right.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel / Update Form (1 span) */}
      <div className="space-y-4">
        {/* Ambulance Selector Pills */}
        <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Select Ambulance ({ambulances.length})
          </h4>
          <div className="space-y-2">
            {ambulances.map((amb) => {
              const isSelected = selectedAmbulance?.id === amb.id;
              return (
                <button
                  key={amb.id}
                  onClick={() => handleSelectAmbulance(amb)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#dff5ea] border-[#167a68] text-[#0b4d3c] shadow-xs'
                      : 'bg-[#f0faf5] border-[#c8eedc] text-slate-600 hover:border-[#167a68]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        amb.is_available ? 'bg-[#dff5ea] text-[#167a68]' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{amb.vehicle_number || `Unit #${amb.id}`}</p>
                      <p className="text-[11px] text-slate-500">{amb.driver_name || 'Driver'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        amb.is_available
                          ? 'bg-[#dff5ea] text-[#167a68] border border-[#c8eedc]'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {amb.is_available ? 'Available' : 'Busy'}
                    </span>
                    {onDeleteAmbulance && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAmbulance(amb.id, amb.vehicle_number);
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove from fleet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Update Location & Status Form */}
        {selectedAmbulance && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#c8eedc] rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#c8eedc] pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Update Location & Status</h4>
                <p className="text-xs text-slate-500">{selectedAmbulance.vehicle_number}</p>
              </div>
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                className="text-[11px] font-semibold text-[#167a68] hover:text-[#0b4d3c] flex items-center gap-1 bg-[#dff5ea] hover:bg-[#c8eedc] px-2.5 py-1 rounded-lg border border-[#c8eedc] transition-colors cursor-pointer"
              >
                <Crosshair className="w-3 h-3" />
                My GPS
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-3 p-2.5 bg-[#fbfdfc] rounded-xl border border-[#c8eedc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_available: e.target.checked,
                      is_on_call: e.target.checked ? false : formData.is_on_call,
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded bg-white border-[#c8eedc] focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Ambulance Available</p>
                  <p className="text-[10px] text-slate-500">Ready for emergency dispatch</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-[#fbfdfc] rounded-xl border border-[#c8eedc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_on_call}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_on_call: e.target.checked,
                      is_available: e.target.checked ? false : formData.is_available,
                    })
                  }
                  className="w-4 h-4 text-red-600 rounded bg-white border-[#c8eedc] focus:ring-red-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Currently On Active Call</p>
                  <p className="text-[10px] text-slate-500">En route to emergency patient</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 px-4 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Broadcasting Location...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Update Location & Broadcast
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
