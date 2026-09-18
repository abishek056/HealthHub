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
    const response = await api.get(`/hospitals/${hospitalId}/beds`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn('[bedService] Using mock bed data.');
      const mock = MOCK_BEDS[parseInt(hospitalId)];
      if (!mock) throw new Error('No mock bed data for this hospital.');
      return mock;
    }
    throw error;
  }
};
