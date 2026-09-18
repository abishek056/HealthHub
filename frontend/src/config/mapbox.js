export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  style: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: [85.3240, 27.7172], // Kathmandu, Nepal
  defaultZoom: 12,
};
