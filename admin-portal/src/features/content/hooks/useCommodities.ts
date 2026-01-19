import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Commodity,
  CommoditiesQueryParams,
  CommoditiesResponse,
  CreateCommodityDto,
  UpdateCommodityDto,
  CommodityStats,
  SeedResult,
  CommodityParentCategory,
} from '../types'

// Get all commodities with filters
export function useCommodities(params: CommoditiesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CommoditiesResponse>>(
        '/admin/content/commodities',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single commodity by ID
export function useCommodity(commodityId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', commodityId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Commodity>>(
        `/admin/content/commodities/${commodityId}`
      )
      return data.data
    },
    enabled: !!commodityId,
    staleTime: 1000 * 60,
  })
}

// Get commodity statistics
export function useCommodityStats() {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CommodityStats>>(
        '/admin/content/commodities/stats'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get commodities grouped by parent category
export function useCommoditiesGrouped() {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', 'grouped'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<string, Commodity[]>>>(
        '/admin/content/commodities/grouped'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Get parent categories
export function useCommodityCategories() {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', 'categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<readonly CommodityParentCategory[]>>(
        '/admin/content/commodities/categories'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (static data)
  })
}

// Get sub-categories for a parent category
export function useCommoditySubCategories(parentCategory: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'commodities', 'categories', parentCategory, 'sub'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>(
        `/admin/content/commodities/categories/${encodeURIComponent(parentCategory)}/sub`
      )
      return data.data
    },
    enabled: !!parentCategory,
    staleTime: 1000 * 60 * 30,
  })
}

// Create commodity mutation
export function useCreateCommodity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateCommodityDto) => {
      const response = await api.post<ApiResponse<Commodity>>(
        '/admin/content/commodities',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'commodities'] })
    },
  })
}

// Update commodity mutation
export function useUpdateCommodity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commodityId, data }: { commodityId: string; data: UpdateCommodityDto }) => {
      const response = await api.patch<ApiResponse<Commodity>>(
        `/admin/content/commodities/${commodityId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'commodities'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'commodities', variables.commodityId],
      })
    },
  })
}

// Toggle mainstream/niche status
export function useToggleCommodityMainstream() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commodityId: string) => {
      const response = await api.post<ApiResponse<Commodity>>(
        `/admin/content/commodities/${commodityId}/toggle-mainstream`
      )
      return response.data
    },
    onSuccess: (_, commodityId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'commodities'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'commodities', commodityId],
      })
    },
  })
}

// Delete commodity mutation
export function useDeleteCommodity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commodityId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/commodities/${commodityId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'commodities'] })
    },
  })
}

// Seed commodities from JSON mapping
export function useSeedCommodities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/commodities/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'commodities'] })
    },
  })
}
