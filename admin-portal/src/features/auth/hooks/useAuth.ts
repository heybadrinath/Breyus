import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Admin {
  _id: string
  email: string
  name: string
  role: string
  lastLogin?: string
  createdAt?: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  statusCode: number
  message: string
  data: {
    admin: Admin
  }
}

interface MeResponse {
  statusCode: number
  message: string
  data: Admin
  valid: boolean
}

export function useAuth() {
  const queryClient = useQueryClient()

  // Get current admin
  const {
    data: adminData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const { data } = await api.get<MeResponse>('/admin/auth/me')
      return data
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post<LoginResponse>('/admin/auth/login', credentials)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] })
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/auth/logout')
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })

  const isAuthenticated = adminData?.valid === true
  const admin = adminData?.data

  return {
    admin,
    isAuthenticated,
    isLoading,
    error,
    refetch,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  }
}
