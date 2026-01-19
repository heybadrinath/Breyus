import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  // Don't add /admin here - the service paths already include it
  // e.g., /admin/system/health, /admin/auth/login
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        // Use basename-aware redirect for production
        const basename = import.meta.env.PROD ? '/admin' : ''
        window.location.href = `${basename}/login`
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface ApiResponse<T = unknown> {
  statusCode: number
  message: string
  data?: T
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
