import React, { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';

const HospitalMap = ({ hospitals, onMarkerClick }) => {
  const [popupInfo, setPopupInfo] = useState(null);
  const navigate = useNavigate();

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