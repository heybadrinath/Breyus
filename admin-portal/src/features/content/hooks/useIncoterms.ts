import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Incoterm,
  IncotermsQueryParams,
  IncotermsResponse,
  UpdateIncotermDto,
  SeedResult,
} from '../types'

/**
 * Get all incoterms with optional filters
 * Note: Incoterms are read-only except for updates - no create/delete
 */
export function useIncoterms(params: IncotermsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'incoterms', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IncotermsResponse>>(
        '/admin/content/incoterms',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - incoterms rarely change
  })
}

/**
 * Get single incoterm by code
 */
export function useIncoterm(code: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'incoterms', code],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Incoterm>>(
        `/admin/content/incoterms/${code}`
      )
      return data.data
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get available incoterm codes
 */
export function useIncotermCodes() {
  return useQuery({
    queryKey: ['admin', 'content', 'incoterms', 'codes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>(
        '/admin/content/incoterms/codes'
      )
      return data.data
    },
    staleTime: Infinity, // Codes never change
  })
}

/**
 * Update incoterm mutation
 * Note: Cannot create or delete - only update existing incoterms
 */
export function useUpdateIncoterm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code, data }: { code: string; data: UpdateIncotermDto }) => {
      const response = await api.patch<ApiResponse<Incoterm>>(
        `/admin/content/incoterms/${code}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate all incoterms queries and the specific incoterm
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'incoterms'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'incoterms', variables.code],
      })
    },
  })
}

/**
 * Seed default incoterms (Incoterms 2020)
 */
export function useSeedIncoterms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/incoterms/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'incoterms'] })
    },
  })
}

/**
 * Reset all incoterms to default values
 * Warning: This will overwrite any customizations
 */
export function useResetIncoterms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ updated: number }>>(
        '/admin/content/incoterms/reset'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'incoterms'] })
    },
  })
}
