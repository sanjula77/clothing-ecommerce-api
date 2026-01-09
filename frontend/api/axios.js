import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

// Use relative URL for proxy, or full URL if VITE_API_URL is set
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 if backend is not running (network error)
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeToken();
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    // Log network errors but don't crash the app
    if (!error.response) {
      console.warn('API request failed - is backend running?', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

