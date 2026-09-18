import api from './api';

/**
 * Appointment Service
 * Provides API functions for booking and managing hospital appointments.
 */

// ── List Appointments ──────────────────────────────────────────────
export const getAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

// ── Book Appointment ────────────────────────────────────────────────
export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

// ── Get Single Appointment ──────────────────────────────────────────
export const getAppointmentDetails = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

// ── Cancel Appointment ──────────────────────────────────────────────
export const cancelAppointment = async (id) => {
  const response = await api.put(`/appointments/${id}/cancel`);
  return response.data;
};

export default {
  getAppointments,
  bookAppointment,
  getAppointmentDetails,
  cancelAppointment,
};
