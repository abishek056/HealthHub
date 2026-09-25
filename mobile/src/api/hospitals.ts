import { apiRequest } from './client';

export type Hospital = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  beds?: {
    icu?: { total: number; available: number };
    emergency?: { total: number; available: number };
    general?: { total: number; available: number };
    private?: { total: number; available: number };
  };
  blood_bank?: Record<string, number>;
  opd_queue?: Record<string, number>;
  ambulances?: Array<{
    id: number;
    driver_name: string;
    phone: string;
    status: string;
    is_available: boolean;
  }>;
  is_active?: boolean;
};

/**
 * Fetch list of all active hospitals
 */
export async function getHospitals(): Promise<Hospital[]> {
  const data = await apiRequest<any>('/hospitals', { auth: false });
  return Array.isArray(data) ? data : data?.data || [];
}

/**
 * Fetch details of a single hospital
 */
export async function getHospital(id: number | string): Promise<Hospital> {
  const data = await apiRequest<any>(`/hospitals/${id}`, { auth: false });
  return data?.data || data;
}

/**
 * Emergency nearest hospital finder
 */
export async function findNearestHospital(latitude: number, longitude: number, bloodGroup?: string): Promise<any> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  if (bloodGroup) params.append('blood_group', bloodGroup);

  const data = await apiRequest<any>(`/emergency/find-nearest-hospital?${params.toString()}`, {
    auth: false,
  });
  return data;
}
