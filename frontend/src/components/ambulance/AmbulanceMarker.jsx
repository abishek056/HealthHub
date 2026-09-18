import React from 'react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    dot: 'bg-green-400',
    ring: 'ring-green-500',
    badge: 'bg-green-100 text-green-800',
    markerBg: 'bg-green-500',
  },
  on_call: {
    label: 'On Call',
    dot: 'bg-yellow-400',
    ring: 'ring-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    markerBg: 'bg-yellow-500',
  },
};

const cfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.available;

// ─── Ambulance SVG icon ───────────────────────────────────────────────────────
const AmbulanceIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
    />
  </svg>
);

/**
 * AmbulanceMarker — a Tailwind-styled div used as a Mapbox GL custom marker.
 *
 * Props:
 *   ambulance   {object}   — ambulance data
 *   isSelected  {boolean}  — whether this marker is currently selected
 *   onClick     {function} — called when marker is clicked
 */
const AmbulanceMarker = ({ ambulance, isSelected, onClick }) => {
  const c = cfg(ambulance.status);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ambulance ${ambulance.vehicle_number}`}
      className={[
        'group relative flex flex-col items-center cursor-pointer focus:outline-none transition-transform duration-200',
        isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10',
      ].join(' ')}
    >
      {/* Pulse ring when available */}
      {ambulance.status === 'available' && (
        <span className={`absolute -inset-1.5 rounded-full opacity-30 animate-ping ${c.markerBg}`} />
      )}

      {/* Marker body */}
      <div
        className={[
          'relative flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg',
          `ring-2 ring-white ${c.markerBg}`,
          isSelected ? 'ring-4 ring-offset-1' : '',
        ].join(' ')}
      >
        <AmbulanceIcon className="w-5 h-5" />
      </div>

      {/* Pointer */}
      <div
        className={[
          'w-0 h-0 -mt-0.5',
          'border-l-[5px] border-l-transparent',
          'border-r-[5px] border-r-transparent',
          `border-t-[7px]`,
        ].join(' ')}
        style={{ borderTopColor: ambulance.status === 'on_call' ? '#eab308' : '#22c55e' }}
      />

      {/* Tooltip on hover (always rendered, shown on hover via group-hover) */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
          <p className="font-semibold">{ambulance.vehicle_number}</p>
          <p className="text-gray-300">{ambulance.driver_name}</p>
          <span className={`inline-flex mt-1 items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
            {c.label}
          </span>
        </div>
      </div>
    </button>
  );
};

export { AmbulanceIcon, STATUS_CONFIG };
export default AmbulanceMarker;
