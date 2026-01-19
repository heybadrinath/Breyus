import { useQuery, useMutation } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  AnalyticsQueryParams,
  ExportParams,
  PlatformOverview,
  TradeAnalytics,
  UserAnalytics,
  FinancialAnalytics,
  OperationalMetrics,
} from '../types'

// ============================================================================
// OVERVIEW METRICS
// ============================================================================

export function useOverviewMetrics(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PlatformOverview>>('/admin/analytics/overview', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// TRADE ANALYTICS
// ============================================================================

export function useTradeAnalytics(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'trades', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TradeAnalytics>>('/admin/analytics/trades', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// USER ANALYTICS
// ============================================================================

export function useUserAnalytics(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'users', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserAnalytics>>('/admin/analytics/users', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// FINANCIAL ANALYTICS
// ============================================================================

export function useFinancialAnalytics(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'financial', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FinancialAnalytics>>('/admin/analytics/financial', {
        params,
      })
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// OPERATIONAL METRICS
// ============================================================================

export function useOperationalMetrics() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'operational'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OperationalMetrics>>('/admin/analytics/operational')
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// EXPORT
// ============================================================================

export function useExportAnalytics() {
  return useMutation({
    mutationFn: async (params: ExportParams) => {
      const response = await api.post('/admin/analytics/export', params, {
        responseType: 'blob',
      })

      // Get filename from content-disposition header or create default
      const contentDisposition = response.headers['content-disposition']
      let filename = `breyus-analytics-${params.section}-${new Date().toISOString().split('T')[0]}.${params.type}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (match) {
          filename = match[1]
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return { success: true, filename }
    },
  })
}

// ============================================================================
// COMBINED ANALYTICS HOOK (for loading all data at once)
// ============================================================================

export function useAllAnalytics(params: AnalyticsQueryParams = {}) {
  const overview = useOverviewMetrics(params)
  const trades = useTradeAnalytics(params)
  const users = useUserAnalytics(params)
  const financial = useFinancialAnalytics(params)
  const operational = useOperationalMetrics()

  return {
    overview,
    trades,
    users,
    financial,
    operational,
    isLoading: overview.isLoading || trades.isLoading || users.isLoading || financial.isLoading || operational.isLoading,
    isError: overview.isError || trades.isError || users.isError || financial.isError || operational.isError,
  }
}
