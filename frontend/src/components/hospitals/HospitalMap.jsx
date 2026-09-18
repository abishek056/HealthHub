import React, { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';

const HospitalMap = ({ hospitals, onMarkerClick }) => {
  const [popupInfo, setPopupInfo] = useState(null);
  const navigate = useNavigate();

  const isMapboxConfigured =
    MAPBOX_CONFIG.accessToken &&
    MAPBOX_CONFIG.accessToken !== 'your_mapbox_token_here' &&
    MAPBOX_CONFIG.accessToken.startsWith('pk.');

  if (!isMapboxConfigured) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-xl overflow-hidden shadow-inner relative flex flex-col items-center justify-center p-6 border border-slate-200">
        {/* Subtle Map Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '20px 20px, 60px 60px, 60px 60px',
          }}
        />

        {/* Mapbox Token Notice */}
        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-full px-3 py-1 text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Map Preview Mode (Set VITE_MAPBOX_TOKEN for live tiles)
        </div>

        {/* Interactive Pin Grid Preview */}
        <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Hospital Locations ({hospitals?.length || 0})
            </h3>
            <span className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full font-semibold">
              Kathmandu Valley
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(hospitals || []).map((hospital) => (
              <div 
                key={hospital.id}
                onClick={() => {
                  setPopupInfo(hospital);
                  if (onMarkerClick) onMarkerClick(hospital);
                }}
                className="group p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary-700">
                    {hospital.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{hospital.address}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/hospitals/${hospital.id}`);
                  }}
                  className="shrink-0 text-xs font-semibold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-xl overflow-hidden shadow-inner relative">
      <Map
        initialViewState={{
          longitude: MAPBOX_CONFIG.defaultCenter[0],
          latitude: MAPBOX_CONFIG.defaultCenter[1],
          zoom: MAPBOX_CONFIG.defaultZoom,
        }}
        mapStyle={MAPBOX_CONFIG.style}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
      >
        <NavigationControl position="top-right" />

        {(hospitals || []).map((hospital) => {
          const lng = hospital.location?.lng ?? hospital.longitude;
          const lat = hospital.location?.lat ?? hospital.latitude;

          if (lng == null || lat == null) return null;

          return (
            <Marker
              key={hospital.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(hospital);
                if (onMarkerClick) onMarkerClick(hospital);
              }}
            >
              <div className="cursor-pointer group flex flex-col items-center">
                <div className="bg-primary-600 text-white rounded-full p-2 shadow-lg shadow-primary-500/50 group-hover:bg-primary-500 transition-colors transform group-hover:-translate-y-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-600 group-hover:border-t-primary-500 -mt-1 transition-colors" />
              </div>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.location?.lng ?? popupInfo.longitude}
            latitude={popupInfo.location?.lat ?? popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="rounded-lg overflow-hidden"
          >
            <div className="p-1">
              <h4 className="font-bold text-gray-900 mb-1">{popupInfo.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{popupInfo.address}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/hospitals/${popupInfo.id}`)}
                  className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100 font-medium transition-colors"
                >
                  Details
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${
                    popupInfo.location?.lat ?? popupInfo.latitude
                  },${popupInfo.location?.lng ?? popupInfo.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 font-medium transition-colors"
                >
                  Directions
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default HospitalMap;