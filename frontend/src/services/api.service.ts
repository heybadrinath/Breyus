import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Session expired or unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// API service object with methods for different endpoints
const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      api.post('/auth/login', { email, password }),
    register: (email: string, password: string, firstName?: string, lastName?: string, role?: string) =>
      api.post('/auth/register', { email, password, firstName, lastName, role }),
    forgotPassword: (email: string, role?: string) =>
      api.post('/auth/forgot-password', { email, role }),
    resetPassword: (email: string, otp: string, newPassword: string, role?: string) =>
      api.post('/auth/reset-password', { email, otp, newPassword, role }),
  },
  
  // Analytics endpoints
  analytics: {
    get: () => api.get('/analytics'),
    update: (data: any) => api.put('/analytics', data),
  },
  
  // Products endpoints
  products: {
    getAll: () => api.get('/products'),
    getOne: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
  },
  
  // Sales endpoints
  sales: {
    get: () => api.get('/sales'),
    update: (data: any) => api.put('/sales', data),
  },
  
  // Security endpoints
  security: {
    getInfo: () => api.get('/security'),
    changePassword: (currentPassword: string, newPassword: string) =>
      api.post('/security/change-password', { currentPassword, newPassword }),
  },
  
  // User endpoints
  users: {
    getProfile: () => api.get('/users/me'),
    updateProfile: (data: any) => api.put('/users/me', data),
    getDetails: (id: string) => api.get(`/users/${id}/details`),
    updateDetails: (id: string, data: any) => api.put(`/users/${id}/details`, data),
  },
};

export default apiService; 