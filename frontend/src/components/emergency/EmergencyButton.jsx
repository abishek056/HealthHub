import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Do not show floating SOS emergency button on management portals (/hospital/* or /admin/*) or auth pages (/login, /register)
  if (
    location.pathname.startsWith('/hospital') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/register'
  ) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">

        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          aria-label="Open Emergency Services & Ambulance Routing"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-xl shadow-rose-600/30 hover:shadow-2xl hover:shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none ring-4 ring-[#167a68]/20 hover:ring-[#167a68]/40 border-2 border-white cursor-pointer"
        >
          {/* Subtle pulse halo ring */}
          <span className="absolute -inset-1 rounded-full bg-[#167a68]/25 animate-ping pointer-events-none opacity-40" />

          {/* Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <AmbulanceIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[10px] font-black uppercase tracking-wider leading-none mt-0.5">
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
