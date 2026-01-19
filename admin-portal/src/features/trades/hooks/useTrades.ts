import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Trade,
  TradesQueryParams,
  PaginatedTradesResponse,
  TradeStats,
  StalledTradesResponse,
  TradeTimelineEvent,
  AdminNote,
  AddTradeNoteDto,
  VerifyDocumentDto,
  VerifyDocumentResponse,
  ForcePhaseChangeDto,
  ForcePhaseChangeResponse,
} from '../types'

// Get paginated list of trades
export function useTrades(params: TradesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'trades', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedTradesResponse>>('/admin/trades', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get trade statistics
export function useTradeStats() {
  return useQuery({
    queryKey: ['admin', 'trades', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TradeStats>>('/admin/trades/stats')
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get stalled trades
export function useStalledTrades(days: number = 7) {
  return useQuery({
    queryKey: ['admin', 'trades', 'stalled', days],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StalledTradesResponse>>('/admin/trades/stalled', {
        params: { days },
      })
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single trade by ID
export function useTrade(tradeId: string) {
  return useQuery({
    queryKey: ['admin', 'trades', tradeId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Trade>>(`/admin/trades/${tradeId}`)
      return data.data
    },
    enabled: !!tradeId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get trade timeline
export function useTradeTimeline(tradeId: string) {
  return useQuery({
    queryKey: ['admin', 'trades', tradeId, 'timeline'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TradeTimelineEvent[]>>(`/admin/trades/${tradeId}/timeline`)
      return data.data
    },
    enabled: !!tradeId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get trade notes
export function useTradeNotes(tradeId: string) {
  return useQuery({
    queryKey: ['admin', 'trades', tradeId, 'notes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminNote[]>>(`/admin/trades/${tradeId}/notes`)
      return data.data
    },
    enabled: !!tradeId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Add note to trade
export function useAddTradeNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tradeId, data }: { tradeId: string; data: AddTradeNoteDto }) => {
      const response = await api.post<ApiResponse<AdminNote>>(`/admin/trades/${tradeId}/notes`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'timeline'] })
    },
  })
}

// Delete note from trade
export function useDeleteTradeNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tradeId, noteId }: { tradeId: string; noteId: string }) => {
      const response = await api.delete<ApiResponse<void>>(`/admin/trades/${tradeId}/notes/${noteId}`)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'timeline'] })
    },
  })
}

// ========================
// Document Verification
// ========================

// Verify or reject a trade document
export function useVerifyDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tradeId, data }: { tradeId: string; data: VerifyDocumentDto }) => {
      const response = await api.put<ApiResponse<VerifyDocumentResponse>>(
        `/admin/trades/${tradeId}/verify-document`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'timeline'] })
    },
  })
}

// ========================
// Force Phase Change
// ========================

// Force change trade phase
export function useForcePhaseChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tradeId, data }: { tradeId: string; data: ForcePhaseChangeDto }) => {
      const response = await api.put<ApiResponse<ForcePhaseChangeResponse>>(
        `/admin/trades/${tradeId}/force-phase`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'timeline'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades', variables.tradeId, 'notes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'trades'] })
    },
  })
}

// ========================
// Document Download
// ========================

// Download a trade document
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ tradeId, docType }: { tradeId: string; docType: string }) => {
      const response = await api.get(`/admin/trades/${tradeId}/documents/${docType}/download`, {
        responseType: 'blob',
      })
      return response
    },
  })
}
