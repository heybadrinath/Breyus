import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Country,
  CountriesQueryParams,
  CountriesResponse,
  CreateCountryDto,
  UpdateCountryDto,
  SeedResult,
} from '../types'

// Get all countries
export function useCountries(params: CountriesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'countries', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CountriesResponse>>(
        '/admin/content/countries',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - countries don't change often
  })
}

// Get single country by ID
export function useCountry(countryId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'countries', countryId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Country>>(
        `/admin/content/countries/${countryId}`
      )
      return data.data
    },
    enabled: !!countryId,
    staleTime: 1000 * 60 * 5,
  })
}

// Create country mutation
export function useCreateCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateCountryDto) => {
      const response = await api.post<ApiResponse<Country>>(
        '/admin/content/countries',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'countries'] })
    },
  })
}

// Update country mutation
export function useUpdateCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ countryId, data }: { countryId: string; data: UpdateCountryDto }) => {
      const response = await api.patch<ApiResponse<Country>>(
        `/admin/content/countries/${countryId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'countries'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'countries', variables.countryId],
      })
      // Also invalidate ports since they reference countries
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
    },
  })
}

// Delete country mutation
export function useDeleteCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (countryId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/countries/${countryId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'countries'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'ports'] })
    },
  })
}

// Seed default countries mutation
export function useSeedCountries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/countries/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'countries'] })
    },
  })
}
