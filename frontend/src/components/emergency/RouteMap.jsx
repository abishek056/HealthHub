import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { getDirectionsRoute } from '../../services/emergencyService';
import { Navigation, MapPin, AlertCircle, Compass } from 'lucide-react';

export default function RouteMap({
  userCoords,
  hospitalCoords,
  hospitalName,
  onRouteCalculated,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  const hasValidToken = Boolean(MAPBOX_CONFIG.accessToken && MAPBOX_CONFIG.accessToken.startsWith('pk.'));

  useEffect(() => {
    if (!userCoords || !hospitalCoords) return;

    // Check token presence
    if (!hasValidToken) {
      setMapError('Mapbox token not configured. Showing direct GPS route.');
      setIsLoadingRoute(false);
      return;
    }

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    const startLng = userCoords.longitude;
    const startLat = userCoords.latitude;
    const destLng = hospitalCoords.longitude;
    const destLat = hospitalCoords.latitude;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_CONFIG.style || 'mapbox://styles/mapbox/streets-v12',
      center: [(startLng + destLng) / 2, (startLat + destLat) / 2],
      zoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

    map.on('load', async () => {
      try {
        // Fetch driving route from Directions API
        const routeData = await getDirectionsRoute(
          { lng: startLng, lat: startLat },
          { lng: destLng, lat: destLat },
          MAPBOX_CONFIG.accessToken
        );

        if (routeData) {
          setRouteInfo(routeData);
          if (onRouteCalculated) {
            onRouteCalculated(routeData);
          }

          // Add GeoJSON route source
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeData.coordinates,
              },
            },
          });

          // Glow / casing layer
          map.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#dc2626',
              'line-width': 8,
              'line-opacity': 0.35,
            },
          });

          // Main route line
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#ef4444',
              'line-width': 4,
            },
          });
        }

        // Add User Location Marker (Blue pulsing dot)
        const userEl = document.createElement('div');
        userEl.className = 'relative flex items-center justify-center';
        userEl.innerHTML = `
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
        `;
        new mapboxgl.Marker({ element: userEl })
          .setLngLat([startLng, startLat])
          .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML('<p class="font-semibold text-xs text-gray-800">Your Location</p>'))
          .addTo(map);

        // Add Hospital Destination Marker (Red emergency pin)
        const hospitalEl = document.createElement('div');
        hospitalEl.className = 'flex items-center justify-center';
        hospitalEl.innerHTML = `
          <div class="bg-red-600 text-white p-2 rounded-full shadow-xl border-2 border-white transform hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
        `;
        new mapboxgl.Marker({ element: hospitalEl })
          .setLngLat([destLng, destLat])
          .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`<p class="font-bold text-xs text-red-600">${hospitalName || 'Hospital'}</p>`))
          .addTo(map);

        // Fit bounds around both user and hospital
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([startLng, startLat]);
        bounds.extend([destLng, destLat]);

        map.fitBounds(bounds, {
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          maxZoom: 15,
          duration: 1000,
        });
      } catch (err) {
        console.warn('Failed to load map route:', err);
      } finally {
        setIsLoadingRoute(false);
      }
    });

    map.on('error', () => {
      setMapError('Failed to load Mapbox tiles.');
      setIsLoadingRoute(false);
    });

    return () => {
      map.remove();
    };
  }, [userCoords, hospitalCoords, hospitalName, hasValidToken]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner">
      {hasValidToken && !mapError ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : (
        /* Fallback view if mapbox token isn't provided */
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-white mb-1">Route to {hospitalName}</p>
          <p className="text-xs text-slate-400 max-w-xs mb-3">
            Active navigation available via Google Maps with real-time turn-by-turn traffic routing.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="flex items-center gap-1 text-blue-400">
              <MapPin className="w-3.5 h-3.5" /> Start: {userCoords?.latitude?.toFixed(4)}, {userCoords?.longitude?.toFixed(4)}
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-red-400">
              <Compass className="w-3.5 h-3.5" /> Dest: {hospitalCoords?.latitude?.toFixed(4)}, {hospitalCoords?.longitude?.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Route Info Pill Overlay */}
      {routeInfo && (
        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-red-500/30 text-xs flex items-center gap-2 shadow-lg">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold text-emerald-300">{routeInfo.durationMinutes} min</span>
          <span className="text-slate-400">({routeInfo.distanceKm} km drive)</span>
        </div>
      )}

      {/* Loading overlay */}
      {isLoadingRoute && hasValidToken && !mapError && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          Calculating fastest emergency route...
        </div>
      )}
    </div>
  );
}
