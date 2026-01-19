import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Currency,
  CurrenciesQueryParams,
  CurrenciesResponse,
  CreateCurrencyDto,
  UpdateCurrencyDto,
  SeedResult,
} from '../types'

// Get all currencies
export function useCurrencies(params: CurrenciesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'currencies', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CurrenciesResponse>>(
        '/admin/content/currencies',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single currency by ID
export function useCurrency(currencyId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'currencies', currencyId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Currency>>(
        `/admin/content/currencies/${currencyId}`
      )
      return data.data
    },
    enabled: !!currencyId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get currency by code
export function useCurrencyByCode(code: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'currencies', 'code', code],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Currency>>(
        `/admin/content/currencies/code/${code}`
      )
      return data.data
    },
    enabled: !!code,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Create currency mutation
export function useCreateCurrency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateCurrencyDto) => {
      const response = await api.post<ApiResponse<Currency>>(
        '/admin/content/currencies',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'currencies'] })
    },
  })
}

// Update currency mutation
export function useUpdateCurrency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ currencyId, data }: { currencyId: string; data: UpdateCurrencyDto }) => {
      const response = await api.patch<ApiResponse<Currency>>(
        `/admin/content/currencies/${currencyId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'currencies'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'currencies', variables.currencyId],
      })
    },
  })
}

// Delete currency mutation
export function useDeleteCurrency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (currencyId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/currencies/${currencyId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'currencies'] })
    },
  })
}

// Seed default currencies mutation
export function useSeedCurrencies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/currencies/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'currencies'] })
    },
  })
}
