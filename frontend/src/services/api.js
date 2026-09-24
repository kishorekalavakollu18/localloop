import axios from 'axios';

// Dynamic API URL detection:
// 1. Uses VITE_API_URL if configured in environment
// 2. If running on Vercel deployment (localloop-mu.vercel.app), targets the deployed Render backend
// 3. Otherwise defaults to '/api' (Vite local dev proxy)
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://localloop-dszf.onrender.com/api';
  }
  return '/api';
};

export const API_URL = getApiBaseUrl();

// Helper to format uploaded image URLs in both local & production
export const getImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const backendHost = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
        ? 'https://localloop-dszf.onrender.com'
        : '');
  return `${backendHost}${url}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all outgoing requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors & 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// API Service Methods
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const providerService = {
  getNearby: async (params = {}) => {
    const res = await api.get('/providers/nearby', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/providers/${id}`);
    return res.data;
  },
  create: async (providerData) => {
    const res = await api.post('/providers', providerData);
    return res.data;
  },
  update: async (id, providerData) => {
    const res = await api.put(`/providers/${id}`, providerData);
    return res.data;
  },
  uploadImage: async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(`/providers/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const bookingService = {
  create: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },
  getCustomerBookings: async (customerId) => {
    const res = await api.get(`/bookings/customer/${customerId}`);
    return res.data;
  },
  getProviderBookings: async (providerId) => {
    const res = await api.get(`/bookings/provider/${providerId}`);
    return res.data;
  },
  updateStatus: async (bookingId, status) => {
    const res = await api.put(`/bookings/${bookingId}/status`, { status });
    return res.data;
  },
};

export const reviewService = {
  create: async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },
  getProviderReviews: async (providerId) => {
    const res = await api.get(`/reviews/provider/${providerId}`);
    return res.data;
  },
};

export default api;
