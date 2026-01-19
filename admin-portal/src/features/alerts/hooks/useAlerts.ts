import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  AlertRule,
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  AlertHistoryQueryParams,
  PaginatedAlertHistoryResponse,
  AlertEventType,
} from '../types'

// Get all alert rules
export function useAlertRules(eventType?: AlertEventType, isEnabled?: boolean) {
  return useQuery({
    queryKey: ['admin', 'alerts', 'rules', eventType, isEnabled],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (eventType) params.eventType = eventType
      if (isEnabled !== undefined) params.isEnabled = String(isEnabled)

      const { data } = await api.get<ApiResponse<AlertRule[]>>(
        '/admin/alerts/rules',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 30,
  })
}

// Get single alert rule by ID
export function useAlertRule(ruleId: string) {
  return useQuery({
    queryKey: ['admin', 'alerts', 'rules', ruleId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AlertRule>>(
        `/admin/alerts/rules/${ruleId}`
      )
      return data.data
    },
    enabled: !!ruleId,
    staleTime: 1000 * 30,
  })
}

// Create alert rule mutation
export function useCreateAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateAlertRuleDto) => {
      const response = await api.post<ApiResponse<AlertRule>>(
        '/admin/alerts/rules',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'rules'] })
    },
  })
}

// Update alert rule mutation
export function useUpdateAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ruleId,
      data,
    }: {
      ruleId: string
      data: UpdateAlertRuleDto
    }) => {
      const response = await api.put<ApiResponse<AlertRule>>(
        `/admin/alerts/rules/${ruleId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'rules'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'alerts', 'rules', variables.ruleId],
      })
    },
  })
}

// Delete alert rule mutation
export function useDeleteAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/alerts/rules/${ruleId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'rules'] })
    },
  })
}

// Toggle alert rule mutation
export function useToggleAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await api.put<ApiResponse<AlertRule>>(
        `/admin/alerts/rules/${ruleId}/toggle`
      )
      return response.data
    },
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'rules'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'alerts', 'rules', ruleId],
      })
    },
  })
}

// Get alert history
export function useAlertHistory(params: AlertHistoryQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'alerts', 'history', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedAlertHistoryResponse>>(
        '/admin/alerts/history',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 30,
  })
}

// Send test alert mutation
export function useSendTestAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await api.post<ApiResponse<void>>(
        `/admin/alerts/test/${ruleId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'history'] })
    },
  })
}
