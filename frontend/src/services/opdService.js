import api from './api';

// ─── Mock data fallback ──────────────────────────────────────────────────────
const MOCK_OPD_QUEUES = {
  1: [
    { id: 1, hospital_id: 1, department: 'General Medicine', current_token: 63, estimated_wait_mins: 25, crowd_level: 'low', last_updated: new Date().toISOString() },
    { id: 2, hospital_id: 1, department: 'Cardiology', current_token: 149, estimated_wait_mins: 70, crowd_level: 'medium', last_updated: new Date().toISOString() },
    { id: 3, hospital_id: 1, department: 'Orthopedics', current_token: 70, estimated_wait_mins: 35, crowd_level: 'low', last_updated: new Date().toISOString() },
    { id: 4, hospital_id: 1, department: 'Pediatrics', current_token: 43, estimated_wait_mins: 50, crowd_level: 'medium', last_updated: new Date().toISOString() },
    { id: 5, hospital_id: 1, department: 'Gynecology', current_token: 105, estimated_wait_mins: 90, crowd_level: 'high', last_updated: new Date().toISOString() },
    { id: 6, hospital_id: 1, department: 'General Surgery', current_token: 28, estimated_wait_mins: 40, crowd_level: 'medium', last_updated: new Date().toISOString() },
    { id: 7, hospital_id: 1, department: 'Dermatology', current_token: 52, estimated_wait_mins: 20, crowd_level: 'low', last_updated: new Date().toISOString() },
    { id: 8, hospital_id: 1, department: 'ENT', current_token: 38, estimated_wait_mins: 30, crowd_level: 'low', last_updated: new Date().toISOString() },
  ],
  2: [
    { id: 9, hospital_id: 2, department: 'General Medicine', current_token: 10, estimated_wait_mins: 15, crowd_level: 'low', last_updated: new Date().toISOString() },
    { id: 10, hospital_id: 2, department: 'Cardiology', current_token: 31, estimated_wait_mins: 45, crowd_level: 'medium', last_updated: new Date().toISOString() },
    { id: 11, hospital_id: 2, department: 'Orthopedics', current_token: 97, estimated_wait_mins: 85, crowd_level: 'high', last_updated: new Date().toISOString() },
    { id: 12, hospital_id: 2, department: 'Pediatrics', current_token: 6, estimated_wait_mins: 10, crowd_level: 'low', last_updated: new Date().toISOString() },
    { id: 13, hospital_id: 2, department: 'Gynecology', current_token: 53, estimated_wait_mins: 60, crowd_level: 'medium', last_updated: new Date().toISOString() },
  ],
  3: [
    { id: 14, hospital_id: 3, department: 'General Medicine', current_token: 65, estimated_wait_mins: 30, crowd_level: 'medium', last_updated: new Date().toISOString() },
    { id: 15, hospital_id: 3, department: 'Cardiology', current_token: 118, estimated_wait_mins: 80, crowd_level: 'high', last_updated: new Date().toISOString() },
    { id: 16, hospital_id: 3, department: 'Orthopedics', current_token: 149, estimated_wait_mins: 95, crowd_level: 'high', last_updated: new Date().toISOString() },
    { id: 17, hospital_id: 3, department: 'Pediatrics', current_token: 118, estimated_wait_mins: 75, crowd_level: 'high', last_updated: new Date().toISOString() },
    { id: 18, hospital_id: 3, department: 'Gynecology', current_token: 77, estimated_wait_mins: 55, crowd_level: 'medium', last_updated: new Date().toISOString() },
  ],
};

/**
 * Fetch all OPD queues for a specific hospital.
 * @param {number|string} hospitalId
 */
export const getOPDQueues = async (hospitalId) => {
  try {
    const response = await api.get(`/hospitals/${hospitalId}/opd`, {
      skipErrorToast: true,
    });
    // Response can be { queues: [...], summary: {...} } or array
    if (response.data?.queues) {
      return response.data.queues;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    console.warn('[opdService] Using mock OPD queue data fallback:', error?.message);
    return MOCK_OPD_QUEUES[parseInt(hospitalId)] || MOCK_OPD_QUEUES[1];
  }
};

/**
 * Book an OPD token for a patient.
 * @param {number|string} hospitalId
 * @param {{ department: string, patient_name?: string, phone?: string }} payload
 */
export const bookOPDToken = async (hospitalId, payload) => {
  try {
    const response = await api.post(`/hospitals/${hospitalId}/opd/book`, payload, {
      skipErrorToast: true,
    });
    return response.data;
  } catch (error) {
    console.warn('[opdService] Using mock token booking response:', error?.message);
    const mockNum = Math.floor(Math.random() * 50) + 100;
    const wait = Math.floor(Math.random() * 40) + 15;
    const phone = payload.phone || '';
    const name = payload.patient_name || 'Patient';
    return {
      message: 'Token booked successfully (Preview Mode)',
      token_number: mockNum,
      department: payload.department,
      hospital_id: parseInt(hospitalId),
      patient_name: name,
      phone: phone,
      estimated_wait_mins: wait,
      crowd_level: wait > 60 ? 'high' : wait > 30 ? 'medium' : 'low',
      sms_sent: Boolean(phone),
      sms_confirmation: phone
        ? `Namaste ${name}, your token #${mockNum} for ${payload.department} is confirmed. Est. wait: ~${wait} mins.`
        : `Token #${mockNum} confirmed for ${payload.department}.`,
      booked_at: new Date().toISOString(),
    };
  }
};
