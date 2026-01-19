import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Port,
  PortsQueryParams,
  PortsResponse,
  CreatePortDto,
  UpdatePortDto,
  SeedResult,
} from '../types'

// Get ports with optional filters
export function usePorts(params: PortsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'ports', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PortsResponse>>(
        '/admin/content/ports',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single port by ID
export function usePort(portId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'ports', portId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Port>>(
        `/admin/content/ports/${portId}`
      )
      return data.data
    },
    enabled: !!portId,
    staleTime: 1000 * 60,
  })
}

// Get ports by country
export function usePortsByCountry(countryId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'ports', 'country', countryId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PortsResponse>>(
        `/admin/content/ports/country/${countryId}`
      )
      return data.data
    },
    enabled: !!countryId,
    staleTime: 1000 * 60,
  })
}

// Create port mutation
export function useCreatePort() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreatePortDto) => {
      const response = await api.post<ApiResponse<Port>>(
        '/admin/content/ports',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
    },
  })
}

// Update port mutation
export function useUpdatePort() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ portId, data }: { portId: string; data: UpdatePortDto }) => {
      const response = await api.patch<ApiResponse<Port>>(
        `/admin/content/ports/${portId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'ports', variables.portId],
      })
    },
  })
}

// Delete port mutation
export function useDeletePort() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (portId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/ports/${portId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
    },
  })
}

// Seed default ports mutation
export function useSeedPorts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/ports/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
    },
  })
}
