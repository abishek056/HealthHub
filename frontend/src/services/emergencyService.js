import api from './api';
import { MAPBOX_CONFIG } from '../config/mapbox';

/**
 * Fallback coordinates (Kathmandu City Center) if geolocation is denied or unavailable
 */
export const DEFAULT_COORDINATES = {
  latitude: 27.7052,
  longitude: 85.3144,
};

/**
 * Get current user location with browser Geolocation API
 * Falls back gracefully to default coordinates if denied or timed out.
 */
export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        coords: DEFAULT_COORDINATES,
        isFallback: true,
        error: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isFallback: false,
          error: null,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Using central Kathmandu as starting point.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Using central Kathmandu.';
        }
        resolve({
          coords: DEFAULT_COORDINATES,
          isFallback: true,
          error: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Call backend to find the nearest hospital with available ICU / Emergency beds
 *
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {string} [params.blood_group]
 * @param {number} [params.radius]
 */
export const findNearestHospital = async ({ latitude, longitude, blood_group, radius = 25 }) => {
  const response = await api.get('/emergency/find-nearest-hospital', {
    params: {
      latitude,
      longitude,
      ...(blood_group ? { blood_group } : {}),
      radius,
    },
  });

  return response.data;
};

/**
 * Fetch driving directions route geometry from Mapbox Directions API
 *
 * @param {{ lng: number, lat: number }} start
 * @param {{ lng: number, lat: number }} destination
 * @param {string} [token]
 */
export const getDirectionsRoute = async (start, destination, token = MAPBOX_CONFIG.accessToken) => {
  if (!token) {
    return null;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&steps=true&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Directions request failed');
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      return {
        coordinates: primaryRoute.geometry.coordinates,
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
        durationMinutes: Math.round(primaryRoute.duration / 60),
        distanceKm: (primaryRoute.distance / 1000).toFixed(1),
        summary: primaryRoute.legs?.[0]?.summary || '',
      };
    }
  } catch (err) {
    console.warn('Mapbox directions error:', err);
  }

  return null;
};

export default {
  getUserLocation,
  findNearestHospital,
  getDirectionsRoute,
  DEFAULT_COORDINATES,
};
