import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  User,
  UsersQueryParams,
  PaginatedUsersResponse,
  UserDetailResponse,
  UpdateUserDto,
  SuspendUserDto,
  UserPageStats,
} from '../types'

// Get paginated list of users
export function useUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedUsersResponse>>('/admin/users', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get single user by ID
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserDetailResponse>>(`/admin/users/${userId}`)
      return data.data
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserDto }) => {
      const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] })
    },
  })
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete<ApiResponse<void>>(`/admin/users/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

// Suspend user mutation
export function useSuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: SuspendUserDto }) => {
      const response = await api.post<ApiResponse<User>>(`/admin/users/${userId}/suspend`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] })
    },
  })
}

// Unsuspend user mutation
export function useUnsuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<ApiResponse<User>>(`/admin/users/${userId}/unsuspend`)
      return response.data
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] })
    },
  })
}

// Force password reset mutation
export function useForcePasswordReset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<ApiResponse<void>>(`/admin/users/${userId}/reset-password`)
      return response.data
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] })
    },
  })
}

// Export user data (GDPR)
export function useExportUserData() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.get(`/admin/users/${userId}/export`, {
        responseType: 'blob',
      })
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `user-data-${userId}-${Date.now()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
  })
}

// Get user stats for KPI cards
export function useUserStats() {
  return useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserPageStats>>('/admin/users/stats')
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}
