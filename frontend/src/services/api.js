import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors and 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Network Error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - only toast if we are not already on login
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
        break;
      case 403:
        toast.error(data.message || 'You do not have permission to perform this action.');
        break;
      case 422:
        // Validation errors usually handled by components, but can be toasted
        toast.error(data.message || 'Validation error occurred.');
        break;
      case 500:
        toast.error('Internal Server Error. Please try again later.');
        break;
      default:
        toast.error(data.message || 'An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
