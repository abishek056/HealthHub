import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Navigation,
  AlertTriangle,
  X,
  Hospital as HospitalIcon,
  Clock,
  MapPin,
  Activity,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Droplet
} from 'lucide-react';
import { getUserLocation, findNearestHospital } from '../../services/emergencyService';
import RouteMap from './RouteMap';

export default function EmergencyModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocationFallback, setIsLocationFallback] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const fetchEmergencyData = useCallback(async (bloodGroup = '') => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get user GPS coordinates
      const loc = await getUserLocation();
      setUserCoords(loc.coords);
      setIsLocationFallback(loc.isFallback);

      // 2. Call backend emergency routing API
      const result = await findNearestHospital({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        blood_group: bloodGroup || undefined,
        radius: 35,
      });

      if (result.success && result.data) {
        setHospitalData(result.data);
      } else {
        setError(result.message || 'No hospital found with available emergency beds.');
      }
    } catch (err) {
      console.error('Emergency lookup error:', err);
      const msg = err.response?.data?.message || 'Failed to locate nearest emergency facility.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchEmergencyData(selectedBloodGroup);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fetchEmergencyData]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hospital = hospitalData?.hospital;
  const ambulanceContact = hospitalData?.ambulance_contact || '102';
  const alternatives = hospitalData?.alternative_hospitals || [];
  const bloodGroupNote = hospitalData?.blood_group_note || null;

  // Estimated drive time (use routeInfo if available, else approximate ~2.5 min per km)
  const estimatedMins = routeInfo?.durationMinutes ?? (hospital?.distance_km ? Math.max(3, Math.round(hospital.distance_km * 2.5)) : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/70 overflow-hidden flex flex-col max-h-[92vh] z-10">
        {/* Emergency Header */}
        <div className="bg-gradient-to-r from-red-650 via-red-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-lg sm:text-xl font-black tracking-wide uppercase flex items-center gap-2">
                Emergency Routing
                <span className="text-[11px] font-bold bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Dispatch
                </span>
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Nearest facility with available ICU & Emergency trauma care
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close emergency modal"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-100 flex-1">
          {/* Quick Filter: Blood Group & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-400" />
              <span className="text-slate-300 font-medium">Blood Group Needed:</span>
              <select
                value={selectedBloodGroup}
                onChange={(e) => {
                  setSelectedBloodGroup(e.target.value);
                  fetchEmergencyData(e.target.value);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold focus:outline-none focus:border-red-500"
              >
                <option value="">Any Available</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchEmergencyData(selectedBloodGroup)}
              disabled={loading}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors font-medium ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Blood group availability note */}
          {!loading && bloodGroupNote && (
            <div className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-2 rounded-lg flex items-start gap-2">
              <Droplet className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>{bloodGroupNote}</span>
            </div>
          )}

          {/* Location fallback notice */}
          {isLocationFallback && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                GPS location unavailable or denied. Showing routing from central Kathmandu.
              </span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Finding closest hospital with ICU beds...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl space-y-3 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-red-200">{error}</p>
              <p className="text-xs text-slate-400">
                Please immediately dial National Emergency Ambulance hotline:
              </p>
              <a
                href={`tel:${ambulanceContact}`}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all text-base"
              >
                <PhoneCall className="w-5 h-5 animate-bounce" />
                Call Ambulance Now ({ambulanceContact})
              </a>
            </div>
          )}

          {/* Hospital Found & Route Content */}
          {!loading && hospital && (
            <>
              {/* Primary Hospital Highlight Card */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-extrabold text-[11px] border border-red-500/30 uppercase tracking-wider">
                        Nearest Match
                      </span>
                      {hospital.icu_beds_available > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          ICU Ready
                        </span>
                      )}
                      {selectedBloodGroup && hospital.has_blood_group && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-extrabold text-[11px] border border-rose-500/30 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-rose-400" />
                          {selectedBloodGroup} In Stock
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                      <HospitalIcon className="w-5 h-5 text-red-400 shrink-0" />
                      {hospital.name}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {hospital.address}
                    </p>
                  </div>

                  {/* Distance & Drive Time Badges */}
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-red-400">
                      {hospital.distance_km} <span className="text-xs font-medium text-slate-400">km</span>
                    </div>
                    {estimatedMins && (
                      <div className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> ~{estimatedMins} mins
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 text-center">
                    <p className="text-[11px] text-slate-400">ICU Beds</p>
                    <p className={`text-base font-black ${hospital.icu_beds_available > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hospital.icu_beds_available} Available
                    </p>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 text-center">
                    <p className="text-[11px] text-slate-400">Emergency Beds</p>
                    <p className={`text-base font-black ${hospital.emergency_beds_available > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {hospital.emergency_beds_available} Available
                    </p>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-slate-400">General Beds</p>
                    <p className="text-base font-black text-blue-400">
                      {hospital.general_beds_available ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mapbox Route Visualizer */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-red-400" />
                    Live Route & Traffic Navigation
                  </span>
                  {routeInfo?.summary && (
                    <span className="text-slate-400 text-[11px]">Via {routeInfo.summary}</span>
                  )}
                </div>
                <RouteMap
                  userCoords={userCoords}
                  hospitalCoords={{ latitude: hospital.latitude, longitude: hospital.longitude }}
                  hospitalName={hospital.name}
                  onRouteCalculated={(info) => setRouteInfo(info)}
                />
              </div>

              {/* Action Buttons: Call Ambulance & Get Directions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* 1. Call Ambulance Button */}
                <a
                  href={`tel:${ambulanceContact}`}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-red-950/60 transition-all text-sm tracking-wide transform active:scale-98"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  Call Ambulance ({ambulanceContact})
                </a>

                {/* 2. Get Directions Button */}
                <a
                  href={hospital.google_maps_directions || `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-600 transition-all text-sm shadow-md"
                >
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  Get Directions (Google Maps)
                </a>
              </div>

              {/* Direct Hospital Phone Call */}
              {hospital.phone && (
                <div className="text-center pt-1">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="text-xs font-semibold text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4 transition-colors"
                  >
                    Direct Hospital Reception: {hospital.phone}
                  </a>
                </div>
              )}

              {/* Alternative Hospitals Accordion */}
              {alternatives.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    <span>Alternative Nearby Hospitals ({alternatives.length})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAlternatives ? 'rotate-90' : ''}`} />
                  </button>

                  {showAlternatives && (
                    <div className="space-y-2 mt-2">
                      {alternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">{alt.name}</p>
                            <p className="text-[11px] text-slate-400">{alt.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${alt.icu_beds_available > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                                {alt.icu_beds_available} ICU
                              </span>
                              {selectedBloodGroup && alt.has_blood_group && (
                                <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                                  <Droplet className="w-2.5 h-2.5 text-rose-400" />
                                  {selectedBloodGroup}
                                </span>
                              )}
                              <span className="text-slate-400 text-[10px]">{alt.distance_km} km away</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {alt.phone && (
                              <a
                                href={`tel:${alt.phone}`}
                                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                title="Call Hospital"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <a
                              href={alt.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${alt.latitude},${alt.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Navigate"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
