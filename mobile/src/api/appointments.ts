import { apiRequest, getLocalUser } from './client';

export type Appointment = {
  id: string;
  doctor: string;
  department: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
  hospital?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
  token_number?: number | null;
  patient_record?: {
    diagnosis?: string;
    treatment?: string;
  } | null;
};

export type BookAppointmentPayload = {
  hospital_id: number;
  department: string;
  doctor_name?: string;
  date: string;     // YYYY-MM-DD
  time: string;     // e.g. "09:00 AM"
  symptoms?: string;
};

/**
 * Book a new appointment for the logged-in patient.
 * Fetches user info from local storage to populate patient_name and patient_phone.
 */
export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  // Get the logged-in user's name and phone from local storage
  const localUser = await getLocalUser();
  const patientName = localUser?.name || 'Patient';
  const patientPhone = localUser?.phone || '0000000000';
  const patientEmail = localUser?.email;

  const data = await apiRequest<any>('/appointments', {
    method: 'POST',
    body: {
      hospital_id: payload.hospital_id,
      department: payload.department,
      doctor_name: payload.doctor_name || undefined,
      appointment_date: payload.date,      // backend expects appointment_date
      time_slot: payload.time,              // backend expects time_slot
      symptoms: payload.symptoms,
      patient_name: patientName,            // backend requires patient_name
      patient_phone: patientPhone,          // backend requires patient_phone
      patient_email: patientEmail,          // optional
    },
  });
  return normalizeAppointment(data.data || data.appointment || data);
}


/**
 * Fetch current patient's appointments (GET /appointments returns the authenticated patient's own).
 */
export async function getMyAppointments(): Promise<Appointment[]> {
  const data = await apiRequest<any>('/appointments');
  const list = Array.isArray(data)
    ? data
    : data.appointments || data.data || data.results || [];
  return list.map(normalizeAppointment);
}

/**
 * Get a single appointment by ID.
 */
export async function getAppointment(id: string | number): Promise<Appointment> {
  const data = await apiRequest<any>(`/appointments/${id}`);
  return normalizeAppointment(data?.appointment || data?.data || data);
}

/**
 * Cancel an appointment.
 */
export async function cancelAppointment(id: string | number): Promise<void> {
  await apiRequest<any>(`/appointments/${id}/cancel`, { method: 'PUT' });
}

/** Optional: list of departments from backend */
export async function getDepartments(): Promise<string[]> {
  try {
    const data = await apiRequest<any>('/departments', { auth: false });
    const list = Array.isArray(data) ? data : data.departments || data.data || [];
    return list.map((d: any) => (typeof d === 'string' ? d : d.name || d.title));
  } catch {
    return [];
  }
}

/** Optional: doctors, optionally filtered by department */
export async function getDoctors(department?: string): Promise<{ id?: string; name: string }[]> {
  try {
    const path = department ? `/doctors?department=${encodeURIComponent(department)}` : '/doctors';
    const data = await apiRequest<any>(path, { auth: false });
    const list = Array.isArray(data) ? data : data.doctors || data.data || [];
    return list.map((d: any) => ({
      id: d.id || d._id,
      name: d.name || d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim(),
    }));
  } catch {
    return [];
  }
}

function normalizeAppointment(raw: any): Appointment {
  const status = (raw.status || 'pending').toLowerCase();
  return {
    id: String(raw.id || raw._id || Date.now()),
    doctor: raw.doctor_name || raw.doctor || raw.doctorName || raw.doctor?.name || '',
    department: raw.department || raw.departmentName || raw.specialty || '',
    date: raw.date || raw.appointmentDate || raw.appointment_date || '',
    time: raw.time_slot || raw.time || raw.appointmentTime || raw.slot || '',
    reason: raw.symptoms || raw.reason || raw.notes || '',
    status,
    hospital: raw.hospital
      ? {
          id: raw.hospital.id,
          name: raw.hospital.name,
          address: raw.hospital.address,
          phone: raw.hospital.phone,
          email: raw.hospital.email,
        }
      : null,
    token_number: raw.token_number ?? null,
    patient_record: raw.patient_record
      ? {
          diagnosis: raw.patient_record.diagnosis,
          treatment: raw.patient_record.treatment,
        }
      : null,
  };
}
