import api from './api';

/**
 * Patient Medical Records Service
 * Used by a logged-in patient to view their OWN medical history —
 * every record entered by every hospital they have ever visited,
 * unified into a single profile view (not scoped to one hospital).
 */

// ── Get every medical record belonging to the logged-in patient ─────
// Optionally pass { hospital_id } to narrow to one hospital.
export const getMyMedicalRecords = async (params = {}) => {
  const response = await api.get('/my-medical-records', { params });
  return response.data;
};

// ── Get full detail of a single record (must belong to the patient) ─
export const getMyMedicalRecord = async (id) => {
  const response = await api.get(`/my-medical-records/${id}`);
  return response.data;
};

export default {
  getMyMedicalRecords,
  getMyMedicalRecord,
};