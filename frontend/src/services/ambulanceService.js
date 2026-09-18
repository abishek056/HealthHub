import api from './api';

// ─── Mock data (fallback while backend is being built) ──────────────────────
const MOCK_AMBULANCES = {
  1: [
    {
      id: 101,
      hospital_id: 1,
      vehicle_number: 'BA 1 KHA 2345',
      driver_name: 'Ram Bahadur Thapa',
      driver_phone: '+977-9841234567',
      status: 'available',
      location: { lat: 27.7080, lng: 85.3110 },
    },
    {
      id: 102,
      hospital_id: 1,
      vehicle_number: 'BA 2 KHA 6789',
      driver_name: 'Hari Prasad Sharma',
      driver_phone: '+977-9851234567',
      status: 'on_call',
      location: { lat: 27.7140, lng: 85.3250 },
    },
  ],
  2: [
    {
      id: 103,
      hospital_id: 2,
      vehicle_number: 'BA 3 CHA 1122',
      driver_name: 'Sita Kumari Tamang',
      driver_phone: '+977-9861234567',
      status: 'available',
      location: { lat: 27.6700, lng: 85.3180 },
    },
  ],
  3: [
    {
      id: 104,
      hospital_id: 3,
      vehicle_number: 'BA 4 JA 3344',
      driver_name: 'Bikash Gurung',
      driver_phone: '+977-9871234567',
      status: 'available',
      location: { lat: 27.7380, lng: 85.3290 },
    },
    {
      id: 105,
      hospital_id: 3,
      vehicle_number: 'BA 5 NA 5566',
      driver_name: 'Sunita Rai',
      driver_phone: '+977-9881234567',
      status: 'on_call',
      location: { lat: 27.7300, lng: 85.3350 },
    },
  ],
};

/**
 * Fetch ambulances for a specific hospital.
 * Falls back to mock data if the API returns 404.
 * @param {number|string} hospitalId
 */
export const getAmbulances = async (hospitalId) => {
  try {
    const response = await api.get(`/hospitals/${hospitalId}/ambulances`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn('[ambulanceService] Using mock ambulance data.');
      return MOCK_AMBULANCES[parseInt(hospitalId)] || [];
    }
    throw error;
  }
};
