import api from './api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BLOOD_BANKS = BLOOD_GROUPS.map((bg, i) => ({
  id: i + 1,
  blood_group: bg,
  units_available: Math.floor(Math.random() * 30) + 1,
  last_updated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  hospital: { id: 1, name: 'City General Hospital', address: '12 MG Road, Bengaluru', phone: '080-12345678' },
}));

const MOCK_DONORS = [
  { id: 1, name: 'Rahul Sharma', blood_group: 'O+', city: 'Bengaluru', is_active: true, eligible: true, distance_km: 2.3 },
  { id: 2, name: 'Priya Nair',   blood_group: 'A+', city: 'Bengaluru', is_active: true, eligible: true, distance_km: 4.1 },
  { id: 3, name: 'Arjun Das',    blood_group: 'B-', city: 'Bengaluru', is_active: true, eligible: false, distance_km: 6.8 },
];

// ─── Blood Bank API ───────────────────────────────────────────────────────────

/**
 * Fetch all blood banks, optionally filtered by blood group / location.
 * @param {{ blood_group?: string, latitude?: number, longitude?: number, radius?: number }} params
 */
export const fetchBloodBanks = async (params = {}) => {
  try {
    const { data } = await api.get('/blood-banks', { params, skipErrorToast: true });
    return Array.isArray(data?.data) ? data.data : data;
  } catch {
    return MOCK_BLOOD_BANKS;
  }
};

/**
 * Fetch a single blood bank by id.
 * @param {number} id
 */
export const fetchBloodBank = async (id) => {
  try {
    const { data } = await api.get(`/blood-banks/${id}`, { skipErrorToast: true });
    return data?.data ?? data;
  } catch {
    return MOCK_BLOOD_BANKS[0];
  }
};

/**
 * Update blood stock for a blood bank (staff only).
 * @param {number} id
 * @param {{ units_available: number }} payload
 */
export const updateBloodStock = async (id, payload) => {
  const { data } = await api.put(`/blood-banks/${id}`, payload);
  return data?.data ?? data;
};

// ─── Blood Donor API ──────────────────────────────────────────────────────────

/**
 * Fetch donors, optionally filtered.
 * @param {{ blood_group?: string, latitude?: number, longitude?: number, radius?: number }} params
 */
export const fetchDonors = async (params = {}) => {
  try {
    const { data } = await api.get('/blood-donors', { params, skipErrorToast: true });
    return Array.isArray(data?.data) ? data.data : data;
  } catch {
    return MOCK_DONORS;
  }
};

/**
 * Register the current user as a blood donor.
 * @param {object} donorData  - matches RegisterDonorRequest fields
 */
export const registerDonor = async (donorData) => {
  const { data } = await api.post('/blood-donors', donorData);
  return data;
};

/**
 * Request blood from the nearest eligible donors.
 * @param {{ blood_group: string, latitude: number, longitude: number, radius?: number }} payload
 */
export const requestBloodDonors = async (payload) => {
  try {
    const { data } = await api.post('/blood-donors/request', payload, { skipErrorToast: true });
    return data;
  } catch {
    return { donors: MOCK_DONORS.filter(d => d.blood_group === payload.blood_group), message: 'Demo data' };
  }
};
