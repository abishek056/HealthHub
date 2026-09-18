import React, { useState, useEffect, useCallback } from 'react';
import { getBedAvailability } from '../../services/bedService';
import useWebSocket from '../../hooks/useWebSocket';

// ─── Ward config ─────────────────────────────────────────────────────────────
const WARD_CONFIG = {
  icu: {
    label: 'ICU',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    /**
     * ICU: Red if < 2 available, Green if >= 2
     */
    getColors: (available) =>
      available < 2
        ? { card: 'bg-red-50 border-red-200',   badge: 'bg-red-100 text-red-700',   icon: 'text-red-500',   bar: 'bg-red-400',   status: 'Critical' }
        : { card: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', icon: 'text-green-500', bar: 'bg-green-400', status: 'Available' },
  },
  emergency: {
    label: 'Emergency',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    /**
     * Emergency: Yellow if < 5 available, Green if >= 5
     */
    getColors: (available) =>
      available < 5
        ? { card: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: 'text-yellow-500', bar: 'bg-yellow-400', status: 'Low' }
        : { card: 'bg-green-50 border-green-200',   badge: 'bg-green-100 text-green-700',   icon: 'text-green-500',  bar: 'bg-green-400',  status: 'Available' },
  },
  general: {
    label: 'General',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    /**
     * General: always green
     */
    getColors: () =>
      ({ card: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', icon: 'text-green-500', bar: 'bg-green-400', status: 'Available' }),
  },
};

// ─── Helper: relative time string ────────────────────────────────────────────
const relativeTime = (date) => {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60)  return 'Updated just now';
  if (diffSec < 120) return 'Updated 1 min ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `Updated ${diffMin} mins ago`;
  return `Updated ${Math.floor(diffMin / 60)}h ago`;
};

// ─── WardCard sub-component ───────────────────────────────────────────────────
const WardCard = ({ wardKey, data }) => {
  const config  = WARD_CONFIG[wardKey];
  const colors  = config.getColors(data.available);
  const pct     = data.total > 0 ? Math.round((data.available / data.total) * 100) : 0;

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 shadow-sm transition-colors duration-500 ${colors.card}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-semibold ${colors.icon}`}>
          {config.icon}
          <span className="text-gray-800">{config.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {colors.status}
        </span>
      </div>

      {/* Bed count */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-extrabold text-gray-900">{data.available}</span>
        <span className="text-sm text-gray-400 mb-1">/ {data.total} beds free</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{pct}% available</p>
    </div>
  );
};

// ─── BedTracker ───────────────────────────────────────────────────────────────
/**
 * BedTracker component
 *
 * Props:
 *  - hospitalId {number|string} — which hospital to show
 *  - hospitalName {string}       — display name (optional)
 */
const BedTracker = ({ hospitalId, hospitalName }) => {
  const [beds, setBeds]             = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Tick every 30s so relativeTime() re-evaluates in the render
  const [, setTick] = useState(0);

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getBedAvailability(hospitalId);
        if (!cancelled) {
          setBeds(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('[BedTracker] Failed to fetch beds', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [hospitalId]);

  // Keep the relative time label refreshing every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Derive the time label during render (no extra state needed)
  const relTime = relativeTime(lastUpdated);

  // WebSocket — subscribe to hospital-specific channel
  // Laravel Reverb broadcasts on channel "hospital.{id}" with event "BedAvailabilityUpdated"
  const channelName = `hospital.${hospitalId}`;
  const handleWsMessage = useCallback((data) => {
    setBeds((prev) => ({ ...prev, ...data }));
    setLastUpdated(new Date());
  }, []);

  const { isConnected } = useWebSocket(channelName, 'BedAvailabilityUpdated', handleWsMessage);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {hospitalName ? `${hospitalName} — ` : ''}Bed Availability
          </h2>
          {relTime && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {relTime}
            </p>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}
          />
          <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['icu', 'emergency', 'general'].map((w) => (
              <div key={w} className="animate-pulse bg-gray-100 rounded-xl h-36" />
            ))}
          </div>
        ) : beds ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(WARD_CONFIG).map(([key]) => (
              <WardCard key={key} wardKey={key} data={beds[key]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            Failed to load bed data.
          </div>
        )}
      </div>
    </div>
  );
};

export default BedTracker;
