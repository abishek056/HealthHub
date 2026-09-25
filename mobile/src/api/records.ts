import { apiRequest } from './client';

export type MedicalRecord = {
  id: string;
  date: string;
  hospital: string;
  hospitalId?: number;
  diagnosis: string;
  treatment: string;
  doctor?: string;
  department?: string;
  age?: number;
  gender?: string;
  phone?: string;
  appointment?: {
    id: number;
    token_number?: number;
    department?: string;
    doctor_name?: string;
    date?: string;
    time?: string;
  } | null;
};

/**
 * Fetch medical records for the logged-in patient.
 * Uses /my-medical-records which returns ALL records across all hospitals.
 */
export async function getMyRecords(): Promise<MedicalRecord[]> {
  const data = await apiRequest<any>('/my-medical-records');
  const list = Array.isArray(data)
    ? data
    : data.records || data.medicalRecords || data.data || data.results || [];
  return list.map(normalizeRecord);
}

/**
 * Fetch a single medical record by ID.
 */
export async function getMyRecord(id: string | number): Promise<MedicalRecord> {
  const data = await apiRequest<any>(`/my-medical-records/${id}`);
  return normalizeRecord(data?.data || data);
}

function normalizeRecord(raw: any): MedicalRecord {
  return {
    id: String(raw.id || raw._id || Date.now()),
    date: raw.created_at || raw.date || raw.createdAt || raw.recordDate || '',
    hospital: raw.hospital?.name || raw.hospital_name || raw.hospitalName || 'Hospital',
    hospitalId: raw.hospital_id || raw.hospitalId,
    diagnosis: raw.diagnosis || raw.title || raw.name || 'Consultation',
    treatment: raw.treatment || raw.notes || raw.details || raw.result || '',
    doctor: raw.appointment?.doctor_name || raw.doctor || raw.doctorName || '',
    department: raw.appointment?.department || raw.department || '',
    age: raw.age,
    gender: raw.gender,
    phone: raw.phone,
    appointment: raw.appointment
      ? {
          id: raw.appointment.id,
          token_number: raw.appointment.token_number,
          department: raw.appointment.department,
          doctor_name: raw.appointment.doctor_name,
          date: raw.appointment.date,
          time: raw.appointment.time,
        }
      : null,
  };
}
