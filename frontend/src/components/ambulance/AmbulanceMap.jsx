import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { getAmbulances } from '../../services/ambulanceService';
import useWebSocket from '../../hooks/useWebSocket';
import AmbulanceMarker, { STATUS_CONFIG } from './AmbulanceMarker';

// ─── Haversine distance (km) ─────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtDist = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

// ─── Hospital pin ─────────────────────────────────────────────────────────────
const HospitalPin = () => (
  <div className="flex flex-col items-center">
    <div className="bg-primary-600 text-white rounded-full p-2.5 shadow-lg shadow-primary-500/40">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-600 -mt-px" />
  </div>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const AmbulanceModal = ({ ambulance, userLocation, onClose }) => {
  if (!ambulance) return null;
  const c = STATUS_CONFIG[ambulance.status] || STATUS_CONFIG.available;
  const dist =
    userLocation
      ? fmtDist(haversine(userLocation.lat, userLocation.lng, ambulance.location.lat, ambulance.location.lng))
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Ambulance Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Vehicle + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Vehicle</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{ambulance.vehicle_number}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${c.badge}`}>
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {c.label}
            </span>
          </div>

          {/* Driver info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                {ambulance.driver_name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-gray-400">Driver</p>
                <p className="font-semibold text-gray-900 text-sm">{ambulance.driver_name}</p>
              </div>
            </div>
            {dist && (
              <div className="flex items-center gap-2 text-sm text-gray-500 pl-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {dist}
              </div>
            )}
          </div>
        </div>

        {/* Footer — CTA buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <a
            href={`tel:${ambulance.driver_phone}`}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-md shadow-primary-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Driver
          </a>
          <a
            href="tel:102"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-md shadow-red-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Emergency 102
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── AmbulanceMap ─────────────────────────────────────────────────────────────
/**
 * AmbulanceMap
 *
 * Props:
 *   hospitalId       {number|string}          — which hospital's ambulances to show
 *   hospital         {object}                 — { name, location: { lat, lng } }
 *   className        {string}                 — optional extra classes for the wrapper
 */
const AmbulanceMap = ({ hospitalId, hospital, className = '' }) => {
  const [ambulances, setAmbulances] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedAmb, setSelectedAmb] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getAmbulances(hospitalId);
        if (!cancelled) setAmbulances(data);
      } catch (err) {
        console.error('[AmbulanceMap] fetch error', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [hospitalId]);

  // Capture user geolocation for distance calculation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied — silently skip */ },
    );
  }, []);

  // WebSocket — listen for AmbulanceLocationUpdated on hospital channel
  const handleWsMessage = useCallback((data) => {
    // Payload: { id, location: { lat, lng }, status }
    setAmbulances((prev) =>
      prev.map((amb) =>
        amb.id === data.id ? { ...amb, ...data } : amb,
      ),
    );
  }, []);

  const { isConnected } = useWebSocket(
    `hospital.${hospitalId}`,
    'AmbulanceLocationUpdated',
    handleWsMessage,
  );

  // Fly to ambulance when selected
  const handleMarkerClick = useCallback((amb) => {
    setSelectedAmb(amb);
    mapRef.current?.flyTo({
      center: [amb.location.lng, amb.location.lat],
      zoom: 14,
      duration: 800,
    });
  }, []);

  // Map center — hospital or default
  const center = hospital?.location
    ? [hospital.location.lng, hospital.location.lat]
    : MAPBOX_CONFIG.defaultCenter;

  const available = ambulances.filter((a) => a.status === 'available').length;

  const isMapboxConfigured =
    MAPBOX_CONFIG.accessToken &&
    MAPBOX_CONFIG.accessToken !== 'your_mapbox_token_here' &&
    MAPBOX_CONFIG.accessToken.startsWith('pk.');

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden font-sans ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              GPS Ambulance Tracking
              {hospital?.name && <span className="text-gray-400 font-normal text-base"> — {hospital.name}</span>}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? 'Loading...' : `${ambulances.length} ambulances · ${available} available`}
            </p>
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between px-5 py-2 bg-white border-b border-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            ))}
          </div>
          {!isMapboxConfigured && (
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
              Preview Mode (Set VITE_MAPBOX_TOKEN)
            </span>
          )}
        </div>

        {/* Map */}
        <div className="h-96 relative">
          {isLoading ? (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <span className="text-gray-400 text-sm">Loading map…</span>
            </div>
          ) : !isMapboxConfigured ? (
            <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-6 text-white">
              {/* Radar Grid Animation Background */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                  backgroundSize: '24px 24px, 72px 72px, 72px 72px',
                }}
              />
              <div className="relative z-10 w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                    Live GPS Radar
                  </span>
                  <span className="text-xs text-slate-400">{ambulances.length} units online</span>
                </div>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {ambulances.map((amb) => (
                    <div 
                      key={amb.id}
                      onClick={() => setSelectedAmb(amb)}
                      className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <span>{amb.vehicle_number}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            amb.status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {amb.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{amb.driver_name} · {amb.phone || amb.driver_phone}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedAmb(amb); }}
                        className="text-xs bg-sky-500 hover:bg-sky-400 text-white font-medium px-3 py-1.5 rounded-lg transition"
                      >
                        Track
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Map
              ref={mapRef}
              initialViewState={{ longitude: center[0], latitude: center[1], zoom: 13 }}
              mapStyle={MAPBOX_CONFIG.style}
              mapboxAccessToken={MAPBOX_CONFIG.accessToken}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              <GeolocateControl
                position="top-right"
                trackUserLocation
                onGeolocate={(e) =>
                  setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude })
                }
              />

              {/* Hospital marker */}
              {hospital?.location && (
                <Marker
                  longitude={hospital.location.lng}
                  latitude={hospital.location.lat}
                  anchor="bottom"
                >
                  <HospitalPin />
                </Marker>
              )}

              {/* Ambulance markers */}
              {ambulances.map((amb) => (
                <Marker
                  key={amb.id}
                  longitude={amb.location.lng}
                  latitude={amb.location.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(amb);
                  }}
                >
                  <AmbulanceMarker
                    ambulance={amb}
                    isSelected={selectedAmb?.id === amb.id}
                    onClick={() => handleMarkerClick(amb)}
                  />
                </Marker>
              ))}

              {/* Popup on selected ambulance */}
              {selectedAmb && (
                <Popup
                  longitude={selectedAmb.location.lng}
                  latitude={selectedAmb.location.lat}
                  anchor="top"
                  onClose={() => setSelectedAmb(null)}
                  closeOnClick={false}
                  className="rounded-xl overflow-hidden"
                >
                  <div className="p-2 min-w-[160px]">
                    <p className="font-bold text-sm text-gray-900">{selectedAmb.vehicle_number}</p>
                    <p className="text-xs text-gray-500">{selectedAmb.driver_name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        /* keep popup open; modal opened separately via marker click */
                        handleMarkerClick(selectedAmb);
                      }}
                      className="mt-2 w-full text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium py-1 rounded transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              )}
            </Map>
          )}
        </div>

        {/* Ambulance list below map */}
        {!isLoading && ambulances.length > 0 && (
          <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
            {ambulances.map((amb) => {
              const c = STATUS_CONFIG[amb.status] || STATUS_CONFIG.available;
              const dist = userLocation
                ? fmtDist(haversine(userLocation.lat, userLocation.lng, amb.location.lat, amb.location.lng))
                : null;

              return (
                <li key={amb.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkerClick(amb)}
                    className={[
                      'w-full text-left flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors',
                      selectedAmb?.id === amb.id ? 'bg-primary-50' : '',
                    ].join(' ')}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 ${c.markerBg}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{amb.vehicle_number}</p>
                      <p className="text-xs text-gray-400 truncate">{amb.driver_name}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{c.label}</span>
                      {dist && <span className="text-xs text-gray-400">{dist}</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {!isLoading && ambulances.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">No ambulances found for this hospital.</div>
        )}
      </div>

      {/* Detail modal */}
      {selectedAmb && (
        <AmbulanceModal
          ambulance={selectedAmb}
          userLocation={userLocation}
          onClose={() => setSelectedAmb(null)}
        />
      )}
    </>
  );
};

export default AmbulanceMap;
