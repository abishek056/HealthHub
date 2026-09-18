import api from './api';

/**
 * Super Admin Service
 * Global management of hospitals, users, and analytics.
 */

// ── Aggregated Stats ──────────────────────────────────────────────────
export const getGlobalStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// ── Hospital Management ──────────────────────────────────────────────
export const getAllHospitals = async (params = {}) => {
  const response = await api.get('/admin/hospitals', { params });
  return response.data;
};

export const createHospital = async (data) => {
  const response = await api.post('/admin/hospitals', data);
  return response.data;
};

export const updateHospital = async (id, data) => {
  const response = await api.put(`/admin/hospitals/${id}`, data);
  return response.data;
};

export const deleteHospital = async (id) => {
  const response = await api.delete(`/admin/hospitals/${id}`);
  return response.data;
};

// ── User Management ──────────────────────────────────────────────────
export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/admin/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// ── Analytics ────────────────────────────────────────────────────────
export const getBedOccupancyTrend = async (params = {}) => {
  const response = await api.get('/admin/analytics/bed-occupancy', { params });
  return response.data;
};

export const getAmbulanceResponseTimes = async (params = {}) => {
  const response = await api.get('/admin/analytics/ambulance-response', { params });
  return response.data;
};

export const getOpdWaitTimes = async (params = {}) => {
  const response = await api.get('/admin/analytics/opd-wait-times', { params });
  return response.data;
};

export default {
  getGlobalStats,
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getBedOccupancyTrend,
  getAmbulanceResponseTimes,
  getOpdWaitTimes,
};
