import axios from 'axios';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

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
  updateLocation: async (locationData) => {
    const res = await api.put('/auth/location', locationData);
    return res.data;
  },
  geocode: async (addressData) => {
    const res = await api.post('/auth/geocode', addressData);
    return res.data;
  },
};

export const providerService = {
  getNearby: async (params = {}) => {
    const res = await api.get('/providers/nearby', { params });
    return res.data;
  },
  getAutocomplete: async (query) => {
    const res = await api.get('/providers/autocomplete', { params: { q: query } });
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
  toggleOnline: async (id, isOnline) => {
    const res = await api.put(`/providers/${id}/toggle-online`, { isOnline });
    return res.data;
  },
  updateLocation: async (id, coordinates) => {
    const res = await api.put(`/providers/${id}/location`, { coordinates });
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
  uploadVerificationDoc: async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(`/providers/${id}/verify-document`, formData, {
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
  getById: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}`);
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
  startTracking: async (bookingId, coordinates) => {
    const res = await api.post(`/bookings/${bookingId}/start-tracking`, { coordinates });
    return res.data;
  },
  updateLiveLocation: async (bookingId, trackingData) => {
    const res = await api.put(`/bookings/${bookingId}/live-location`, trackingData);
    return res.data;
  },
  stopTracking: async (bookingId, markCompleted = false) => {
    const res = await api.post(`/bookings/${bookingId}/stop-tracking`, { markCompleted });
    return res.data;
  },
  getRoute: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}/route`);
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

export const adminService = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getPendingVerifications: async () => {
    const res = await api.get('/admin/providers/pending');
    return res.data;
  },
  updateVerificationStatus: async (id, status) => {
    const res = await api.put(`/admin/providers/${id}/verify`, { status });
    return res.data;
  },
  toggleUserBan: async (userId) => {
    const res = await api.put(`/admin/users/${userId}/ban`);
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
};

export const messageService = {
  getBookingMessages: async (bookingId) => {
    const res = await api.get(`/messages/${bookingId}`);
    return res.data;
  },
  sendMessage: async (data) => {
    const res = await api.post('/messages', data);
    return res.data;
  },
};

export default api;
