import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Unit,
  UnitsQueryParams,
  UnitsResponse,
  CreateUnitDto,
  UpdateUnitDto,
  UnitStats,
  SeedResult,
  UnitType,
} from '../types'

// Get all units with filters
export function useUnits(params: UnitsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'units', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UnitsResponse>>(
        '/admin/content/units',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single unit by ID
export function useUnit(unitId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'units', unitId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Unit>>(
        `/admin/content/units/${unitId}`
      )
      return data.data
    },
    enabled: !!unitId,
    staleTime: 1000 * 60,
  })
}

// Get unit by code
export function useUnitByCode(code: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'units', 'code', code],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Unit>>(
        `/admin/content/units/code/${code}`
      )
      return data.data
    },
    enabled: !!code,
    staleTime: 1000 * 60,
  })
}

// Get unit statistics
export function useUnitStats() {
  return useQuery({
    queryKey: ['admin', 'content', 'units', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UnitStats>>(
        '/admin/content/units/stats'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get units grouped by type
export function useUnitsGrouped() {
  return useQuery({
    queryKey: ['admin', 'content', 'units', 'grouped'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<UnitType, Unit[]>>>(
        '/admin/content/units/grouped'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Get unit types
export function useUnitTypes() {
  return useQuery({
    queryKey: ['admin', 'content', 'units', 'types'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<readonly UnitType[]>>(
        '/admin/content/units/types'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (static data)
  })
}

// Create unit mutation
export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateUnitDto) => {
      const response = await api.post<ApiResponse<Unit>>(
        '/admin/content/units',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'units'] })
    },
  })
}

// Update unit mutation
export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ unitId, data }: { unitId: string; data: UpdateUnitDto }) => {
      const response = await api.patch<ApiResponse<Unit>>(
        `/admin/content/units/${unitId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'units'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'units', variables.unitId],
      })
    },
  })
}

// Delete unit mutation
export function useDeleteUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (unitId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/units/${unitId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'units'] })
    },
  })
}

// Seed default units
export function useSeedUnits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/units/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'units'] })
    },
  })
}
