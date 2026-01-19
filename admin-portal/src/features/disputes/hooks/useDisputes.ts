import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Dispute,
  DisputesQueryParams,
  PaginatedDisputesResponse,
  DisputeStats,
  DisputeMessage,
  AssignDisputeDto,
  SelfAssignDisputeDto,
  UpdateDisputeStatusDto,
  ResolveDisputeDto,
  AddDisputeMessageDto,
} from '../types'

// Get paginated list of disputes
export function useDisputes(params: DisputesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedDisputesResponse>>('/admin/disputes', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get dispute statistics
export function useDisputeStats() {
  return useQuery({
    queryKey: ['admin', 'disputes', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DisputeStats>>('/admin/disputes/stats')
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single dispute by ID
export function useDispute(disputeId: string) {
  return useQuery({
    queryKey: ['admin', 'disputes', disputeId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}`)
      return data.data
    },
    enabled: !!disputeId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get dispute messages
export function useDisputeMessages(disputeId: string) {
  return useQuery({
    queryKey: ['admin', 'disputes', disputeId, 'messages'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DisputeMessage[]>>(`/admin/disputes/${disputeId}/messages`)
      return data.data
    },
    enabled: !!disputeId,
    staleTime: 1000 * 15, // 15 seconds for messages
  })
}

// Assign dispute to admin
export function useAssignDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: AssignDisputeDto }) => {
      const response = await api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/assign`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId] })
    },
  })
}

// Self-assign dispute
export function useSelfAssignDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data?: SelfAssignDisputeDto }) => {
      const response = await api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/self-assign`, data || {})
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId] })
    },
  })
}

// Update dispute status
export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: UpdateDisputeStatusDto }) => {
      const response = await api.patch<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/status`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId] })
    },
  })
}

// Resolve dispute
export function useResolveDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: ResolveDisputeDto }) => {
      const response = await api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/resolve`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId] })
      // Also invalidate trades since activeDispute is cleared
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades'] })
    },
  })
}

// Add message to dispute
export function useAddDisputeMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: AddDisputeMessageDto }) => {
      const response = await api.post<ApiResponse<DisputeMessage>>(`/admin/disputes/${disputeId}/messages`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes', variables.disputeId, 'messages'] })
    },
  })
}
