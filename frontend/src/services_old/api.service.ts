import axios, { AxiosRequestConfig } from 'axios';

// Extend the AxiosRequestConfig interface to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

const API_URL = process.env.REACT_APP_API_URL || 'https://breyus.com/backend';

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
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure token is properly formatted with Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
    } else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.token) {
            config.headers.Authorization = user.token.startsWith('Bearer ') 
              ? user.token 
              : `Bearer ${user.token}`;
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date().getTime() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Calculate and log request duration
    const endTime = new Date().getTime();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      console.debug(`Request to ${response.config.url} completed in ${endTime - startTime}ms`);
    }
    return response;
  },
  async (error) => {
    // For debugging: log detailed errors
    if (error.response) {
      console.debug(`Request failed with status ${error.response.status}: ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.debug(`No response received for request: ${error.config?.url}`);
    } else {
      console.debug(`Error setting up request: ${error.message}`);
    }
    
    // Check for authentication errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error detected:', error.response.data);
      
      // Don't validate token if URL is already auth-related to prevent loops
      const isAuthRelatedUrl = error.config?.url?.includes('/auth/');
      
      if (!isAuthRelatedUrl) {
        try {
          const authService = (await import('./auth.service')).default;
          const isValid = await authService.validateTokenWithBackend();
          
          if (!isValid) {
            console.log('Token validation failed, redirecting to login');
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not in settings page to prevent loops
            const isSettingsPage = window.location.pathname.includes('/settings');
            if (!isSettingsPage) {
              window.location.href = '/signin';
            }
          } else {
            // Token is still valid, might be an issue with the specific request
            console.log('Token is valid, but request was unauthorized');
            return Promise.reject(error);
          }
        } catch (validationError) {
          console.error('Error during token validation:', validationError);
          // Clear auth data as a precaution
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Only redirect if not in settings page to prevent loops
          const isSettingsPage = window.location.pathname.includes('/settings');
          if (!isSettingsPage) {
            window.location.href = '/signin';
          }
        }
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