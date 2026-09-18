import React, { useState } from 'react';
import EmergencyModal from './EmergencyModal';

/**
 * Ambulance Icon SVG (clean, high-contrast, scalable)
 */
function AmbulanceIcon({ className = 'w-7 h-7' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Vehicle body */}
      <path d="M10 17h4" />
      <path d="M5 17H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2h3l3 3v5a2 2 0 0 1-2 2h-1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      {/* Medical Cross */}
      <path d="M8 8v4" />
      <path d="M6 10h4" />
      {/* Emergency Beacon */}
      <path d="M7 3h2" />
    </svg>
  );
}

export default function EmergencyButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        {/* Floating tooltip label on hover/focus */}
        <span className="hidden sm:inline-block mr-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white font-bold text-xs shadow-xl border border-red-500/30 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
          Emergency ICU & Ambulance (102)
        </span>

        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          aria-label="Open Emergency Services & Ambulance Routing"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white shadow-2xl shadow-red-600/60 hover:shadow-red-500/80 hover:scale-108 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-400/50 cursor-pointer"
        >
          {/* Pulsing beacon radar ring */}
          <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
          <span className="absolute -inset-2 rounded-full bg-red-600/20 animate-pulse pointer-events-none" />

          {/* Icon with emergency siren vibration */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <AmbulanceIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none mt-0.5">
              SOS
            </span>
          </div>
        </button>
      </div>

      {/* Emergency Modal Dialog */}
      <EmergencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
