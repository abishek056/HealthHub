import api from './api';

/**
 * Hospital Admin Service
 * Provides API functions for hospital administrators and hospital staff.
 */

// ── Hospital Overview ───────────────────────────────────────────────
export const getHospitalDetails = async (hospitalId) => {
  const response = await api.get(`/hospitals/${hospitalId}`);
  return response.data;
};

// ── Beds Management ──────────────────────────────────────────────────
export const getBeds = async (hospitalId) => {
  const response = await api.get(`/hospitals/${hospitalId}/beds`);
  return response.data;
};

export const updateBed = async (hospitalId, bedId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/beds/${bedId}`, data);
  return response.data;
};

export const createBed = async (hospitalId, data) => {
  const response = await api.post(`/hospitals/${hospitalId}/beds`, data);
  return response.data;
};

export const deleteBed = async (hospitalId, bedId) => {
  const response = await api.delete(`/hospitals/${hospitalId}/beds/${bedId}`);
  return response.data;
};

// ── Ambulance Tracking & Status ──────────────────────────────────────
export const getAmbulances = async (hospitalId) => {
  const response = await api.get(`/hospitals/${hospitalId}/ambulances`);
  return response.data;
};

export const createAmbulance = async (hospitalId, data) => {
  const response = await api.post(`/hospitals/${hospitalId}/ambulances`, data);
  return response.data;
};

export const deleteAmbulance = async (hospitalId, ambulanceId) => {
  const response = await api.delete(`/hospitals/${hospitalId}/ambulances/${ambulanceId}`);
  return response.data;
};

export const updateAmbulanceLocation = async (hospitalId, ambulanceId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/ambulances/${ambulanceId}/track`, data);
  return response.data;
};

export const updateAmbulance = async (hospitalId, ambulanceId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/ambulances/${ambulanceId}`, data);
  return response.data;
};

// ── OPD Queues Management ────────────────────────────────────────────
export const getOpdQueues = async (hospitalId) => {
  const response = await api.get(`/hospitals/${hospitalId}/opd`);
  return response.data;
};

export const createOpdQueue = async (hospitalId, data) => {
  const response = await api.post(`/hospitals/${hospitalId}/opd`, data);
  return response.data;
};

export const deleteOpdQueue = async (hospitalId, queueId) => {
  const response = await api.delete(`/hospitals/${hospitalId}/opd/${queueId}`);
  return response.data;
};

export const updateOpdQueue = async (hospitalId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/opd`, data);
  return response.data;
};

// ── Initialize Default Services ──────────────────────────────────────
export const initializeHospitalDefaults = async (hospitalId) => {
  const response = await api.post(`/hospitals/${hospitalId}/initialize-defaults`);
  return response.data;
};

// ── Patient Records (Tenant Isolated) ────────────────────────────────
export const getPatientRecords = async (params = {}) => {
  const response = await api.get('/patient-records', { params });
  return response.data;
};

export const getPatientRecord = async (id) => {
  const response = await api.get(`/patient-records/${id}`);
  return response.data;
};

export const createPatientRecord = async (data) => {
  const response = await api.post('/patient-records', data);
  return response.data;
};

export const updatePatientRecord = async (id, data) => {
  const response = await api.put(`/patient-records/${id}`, data);
  return response.data;
};

export const deletePatientRecord = async (id) => {
  const response = await api.delete(`/patient-records/${id}`);
  return response.data;
};

// ── Hospital Staff Management (Tenant Scoped) ────────────────────────
export const getHospitalStaff = async (hospitalId, params = {}) => {
  const response = await api.get(`/hospitals/${hospitalId}/staff`, { params });
  return response.data;
};

export const createHospitalStaff = async (hospitalId, data) => {
  const response = await api.post(`/hospitals/${hospitalId}/staff`, data);
  return response.data;
};

export const updateHospitalStaff = async (hospitalId, userId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/staff/${userId}`, data);
  return response.data;
};

export const deleteHospitalStaff = async (hospitalId, userId) => {
  const response = await api.delete(`/hospitals/${hospitalId}/staff/${userId}`);
  return response.data;
};

// ── Appointments Management (Tenant Scoped) ─────────────────────────
export const getHospitalAppointments = async (hospitalId, params = {}) => {
  const response = await api.get(`/hospitals/${hospitalId}/appointments`, { params });
  return response.data;
};

export const updateAppointmentStatus = async (id, status, extra = {}) => {
  const response = await api.put(`/appointments/${id}/status`, {
    status,
    ...extra,
  });
  return response.data;
};

// ── Register Patient Directly from Hospital Portal ──────────────────
export const registerPatientByStaff = async (data) => {
  const response = await api.post('/hospital/register-patient', data);
  return response.data;
};

export default {
  getHospitalDetails,
  getBeds,
  updateBed,
  createBed,
  deleteBed,
  getAmbulances,
  createAmbulance,
  deleteAmbulance,
  updateAmbulanceLocation,
  updateAmbulance,
  getOpdQueues,
  createOpdQueue,
  deleteOpdQueue,
  updateOpdQueue,
  initializeHospitalDefaults,
  getPatientRecords,
  getPatientRecord,
  createPatientRecord,
  updatePatientRecord,
  deletePatientRecord,
  getHospitalStaff,
  createHospitalStaff,
  updateHospitalStaff,
  deleteHospitalStaff,
  getHospitalAppointments,
  updateAppointmentStatus,
  registerPatientByStaff,
};
