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

// ── Ambulance Tracking & Status ──────────────────────────────────────
export const getAmbulances = async (hospitalId) => {
  const response = await api.get(`/hospitals/${hospitalId}/ambulances`);
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

export const updateOpdQueue = async (hospitalId, data) => {
  const response = await api.put(`/hospitals/${hospitalId}/opd`, data);
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

export default {
  getHospitalDetails,
  getBeds,
  updateBed,
  getAmbulances,
  updateAmbulanceLocation,
  updateAmbulance,
  getOpdQueues,
  updateOpdQueue,
  getPatientRecords,
  getPatientRecord,
  createPatientRecord,
  updatePatientRecord,
  deletePatientRecord,
};
