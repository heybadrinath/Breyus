import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Company,
  CompanyDetail,
  CompaniesQueryParams,
  PaginatedCompaniesResponse,
  CompanyStats,
  CompanyPageStats,
} from '../types'

// Get paginated companies list
export function useCompanies(params: CompaniesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'companies', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const response = await api.get<PaginatedCompaniesResponse>(
        `/admin/companies?${searchParams.toString()}`
      )
      return response.data
    },
  })
}

// Get single company by ID
export function useCompany(id: string) {
  return useQuery({
    queryKey: ['admin', 'company', id],
    queryFn: async () => {
      const response = await api.get<CompanyDetail>(`/admin/companies/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Get company stats
export function useCompanyStats(id: string) {
  return useQuery({
    queryKey: ['admin', 'company', id, 'stats'],
    queryFn: async () => {
      const response = await api.get<CompanyStats>(`/admin/companies/${id}/stats`)
      return response.data
    },
    enabled: !!id,
  })
}

// Update company
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Company>
    }) => {
      const response = await api.patch<Company>(`/admin/companies/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', variables.id] })
    },
  })
}

// Delete company
export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/companies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
    },
  })
}

// Verify company
export function useVerifyCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post<Company>(`/admin/companies/${id}/verify`, { notes })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', variables.id] })
    },
  })
}

// Unverify company
export function useUnverifyCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Company>(`/admin/companies/${id}/unverify`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', id] })
    },
  })
}

// Get company page stats for KPI cards (aggregate stats across all companies)
export function useCompanyPageStats() {
  return useQuery({
    queryKey: ['admin', 'companies', 'page-stats'],
    queryFn: async () => {
      const response = await api.get<{ data: CompanyPageStats }>('/admin/companies/stats')
      return response.data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Approve GST manually (for Indian companies when Cashfree API failed)
export function useApproveGst() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post<Company>(`/admin/companies/${id}/gst/approve`, { notes })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', variables.id] })
    },
  })
}

// Clear GST pending manual review flag
export function useClearGstFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Company>(`/admin/companies/${id}/gst/clear-flag`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', id] })
    },
  })
}

// Get count of companies with pending GST manual review
export function useGstPendingCount() {
  return useQuery({
    queryKey: ['admin', 'companies', 'gst-pending-count'],
    queryFn: async () => {
      const response = await api.get<{ data: { count: number } }>('/admin/companies/gst/pending-count')
      return response.data.data.count
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}
