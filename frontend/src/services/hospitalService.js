import api from './api';

// MOCK DATA for preview until backend is built
const MOCK_HOSPITALS = [
  {
    id: 1,
    name: 'Bir Hospital',
    address: 'Kantipath, Kathmandu',
    phone: '+977-1-4221988',
    location: { lat: 27.7056, lng: 85.3134 },
    services: ['Emergency', 'ICU', 'Blood Bank'],
    beds: { icu: { total: 50, available: 5 }, emergency: { total: 30, available: 12 }, general: { total: 200, available: 45 } },
    blood_bank: { 'A+': 15, 'B+': 20, 'O+': 30, 'AB+': 5, 'A-': 2, 'B-': 3, 'O-': 4, 'AB-': 1 },
    ambulances: [
      { id: 101, status: 'available', location: { lat: 27.706, lng: 85.312 } },
      { id: 102, status: 'dispatched', location: { lat: 27.71, lng: 85.32 } }
    ],
    opd_queue: { 'Cardiology': 12, 'Orthopedics': 5, 'Pediatrics': 8 }
  },
  {
    id: 2,
    name: 'Patan Hospital',
    address: 'Lagankhel, Lalitpur',
    phone: '+977-1-5522278',
    location: { lat: 27.6683, lng: 85.3206 },
    services: ['Emergency', 'ICU', 'Maternity'],
    beds: { icu: { total: 40, available: 2 }, emergency: { total: 25, available: 0 }, general: { total: 150, available: 20 } },
    blood_bank: { 'A+': 10, 'B+': 12, 'O+': 18, 'AB+': 8, 'A-': 1, 'B-': 2, 'O-': 5, 'AB-': 0 },
    ambulances: [
      { id: 103, status: 'available', location: { lat: 27.67, lng: 85.321 } }
    ],
    opd_queue: { 'Maternity': 20, 'General Medicine': 15, 'Surgery': 4 }
  },
  {
    id: 3,
    name: 'Tribhuvan University Teaching Hospital (TUTH)',
    address: 'Maharajgunj, Kathmandu',
    phone: '+977-1-4412303',
    location: { lat: 27.7360, lng: 85.3308 },
    services: ['Emergency', 'ICU', 'Blood Bank', 'Organ Transplant'],
    beds: { icu: { total: 80, available: 10 }, emergency: { total: 50, available: 5 }, general: { total: 400, available: 60 } },
    blood_bank: { 'A+': 25, 'B+': 30, 'O+': 45, 'AB+': 12, 'A-': 4, 'B-': 5, 'O-': 6, 'AB-': 2 },
    ambulances: [
      { id: 104, status: 'available', location: { lat: 27.735, lng: 85.331 } },
      { id: 105, status: 'available', location: { lat: 27.737, lng: 85.329 } }
    ],
    opd_queue: { 'Neurology': 25, 'ENT': 10, 'Oncology': 18 }
  }
];

export const getHospitals = async (filters = {}) => {
  try {
    // Attempt real API call
    const response = await api.get('/hospitals', { params: filters });
    return response.data;
  } catch (error) {
    // Fallback to mock data on 404 (backend not ready)
    if (error.response?.status === 404) {
      console.warn("Using mock hospital data since backend route is missing.");
      
      let filtered = [...MOCK_HOSPITALS];
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(h => h.name.toLowerCase().includes(query) || h.address.toLowerCase().includes(query));
      }
      if (filters.service) {
        filtered = filtered.filter(h => h.services.includes(filters.service));
      }
      return filtered;
    }
    throw error;
  }
};

export const getHospitalById = async (id) => {
  try {
    // Attempt real API call
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  } catch (error) {
    // Fallback to mock data on 404
    if (error.response?.status === 404) {
      console.warn("Using mock hospital detail data since backend route is missing.");
      const hospital = MOCK_HOSPITALS.find(h => h.id === parseInt(id));
      if (!hospital) throw new Error("Hospital not found in mock data");
      return hospital;
    }
    throw error;
  }
};
