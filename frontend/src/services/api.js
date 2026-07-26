import axios from 'axios';

// Use environment variable for production, fallback to relative path for local development
// In production (Vercel), set VITE_API_URL = https://mbelwa-backend.vercel.app/api
// Locally, Vite will proxy /api to http://localhost:5000
const API_URL = import.meta.env.VITE_API_URL || '/api';

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

export default api;