import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  HSNCode,
  HSNCodesQueryParams,
  HSNCodesResponse,
  CreateHSNCodeDto,
  UpdateHSNCodeDto,
  BulkImportResult,
} from '../types'

interface HSNStats {
  total: number
  byCategory: Array<{ category: string; count: number }>
}

// Get HSN codes with filters and pagination
export function useHSNCodes(params: HSNCodesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'hsn-codes', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HSNCodesResponse>>(
        '/admin/content/hsn-codes',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single HSN code by ID
export function useHSNCode(hsnId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'hsn-codes', hsnId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HSNCode>>(
        `/admin/content/hsn-codes/${hsnId}`
      )
      return data.data
    },
    enabled: !!hsnId,
    staleTime: 1000 * 60,
  })
}

// Get HSN statistics
export function useHSNStats() {
  return useQuery({
    queryKey: ['admin', 'content', 'hsn-codes', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HSNStats>>(
        '/admin/content/hsn-codes/stats'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get HSN categories
export function useHSNCategories() {
  return useQuery({
    queryKey: ['admin', 'content', 'hsn-codes', 'categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>(
        '/admin/content/hsn-codes/categories'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Search HSN codes (for autocomplete)
export function useSearchHSNCodes(query: string, limit: number = 20) {
  return useQuery({
    queryKey: ['admin', 'content', 'hsn-codes', 'search', query, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HSNCode[]>>(
        '/admin/content/hsn-codes/search',
        { params: { q: query, limit } }
      )
      return data.data
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Create HSN code mutation
export function useCreateHSNCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateHSNCodeDto) => {
      const response = await api.post<ApiResponse<HSNCode>>(
        '/admin/content/hsn-codes',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'hsn-codes'] })
    },
  })
}

// Bulk import HSN codes mutation
export function useBulkImportHSNCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      skipDuplicates = true,
    }: {
      data: Array<{ code: string; description: string; category?: string }>
      skipDuplicates?: boolean
    }) => {
      const response = await api.post<ApiResponse<BulkImportResult>>(
        '/admin/content/hsn-codes/bulk-import',
        { data, skipDuplicates }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'hsn-codes'] })
    },
  })
}

// Update HSN code mutation
export function useUpdateHSNCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ hsnId, data }: { hsnId: string; data: UpdateHSNCodeDto }) => {
      const response = await api.patch<ApiResponse<HSNCode>>(
        `/admin/content/hsn-codes/${hsnId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'hsn-codes'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'hsn-codes', variables.hsnId],
      })
    },
  })
}

// Delete HSN code mutation
export function useDeleteHSNCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (hsnId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/hsn-codes/${hsnId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'hsn-codes'] })
    },
  })
}
