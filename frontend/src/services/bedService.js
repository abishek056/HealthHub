import api from './api';

// ─── Mock data (fallback while backend is being built) ──────────────────────
const MOCK_BEDS = {
  1: {
    hospital_id: 1,
    icu:       { total: 50, available: 1 },
    emergency: { total: 30, available: 3 },
    general:   { total: 200, available: 45 },
  },
  2: {
    hospital_id: 2,
    icu:       { total: 40, available: 8 },
    emergency: { total: 25, available: 0 },
    general:   { total: 150, available: 20 },
  },
  3: {
    hospital_id: 3,
    icu:       { total: 80, available: 12 },
    emergency: { total: 50, available: 6 },
    general:   { total: 400, available: 60 },
  },
};

/**
 * Fetch bed availability for a specific hospital.
 * Falls back to mock data if the API returns 404.
 * @param {number|string} hospitalId
 */
export const getBedAvailability = async (hospitalId) => {
  try {
    const response = await api.get(`/hospitals/${hospitalId}/beds`, {
      skipErrorToast: true,
    });
    return response.data;
  } catch (error) {
    console.warn('[bedService] Using mock bed data fallback:', error?.message);
    const mock = MOCK_BEDS[parseInt(hospitalId)];
    if (mock) return mock;
    return {
      hospital_id: hospitalId,
      icu: { total: 10, available: 2 },
      emergency: { total: 15, available: 5 },
      general: { total: 50, available: 20 },
    };
  }
};
