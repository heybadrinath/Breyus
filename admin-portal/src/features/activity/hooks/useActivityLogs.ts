import { useQuery, useMutation } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  ActivityLog,
  ActivityLogsQueryParams,
  PaginatedActivityLogsResponse,
  ActivitySummary,
} from '../types'

// Get paginated list of activity logs
export function useActivityLogs(params: ActivityLogsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'activity', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedActivityLogsResponse>>(
        '/admin/activity',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get single activity log by ID
export function useActivityLog(logId: string) {
  return useQuery({
    queryKey: ['admin', 'activity', logId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ActivityLog>>(
        `/admin/activity/${logId}`
      )
      return data.data
    },
    enabled: !!logId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get activity summary by category
export function useActivitySummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['admin', 'activity', 'summary', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const { data } = await api.get<ApiResponse<ActivitySummary[]>>(
        '/admin/activity/summary/by-category',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get recent activity
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['admin', 'activity', 'recent', limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ActivityLog[]>>(
        '/admin/activity/recent/list',
        { params: { limit } }
      )
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Export activity logs as CSV
export function useExportActivityLogs() {
  return useMutation({
    mutationFn: async (params: Omit<ActivityLogsQueryParams, 'page' | 'limit' | 'search'>) => {
      const response = await api.get('/admin/activity/export', {
        params,
        responseType: 'blob',
      })

      // Get filename from content-disposition header or create default
      const contentDisposition = response.headers['content-disposition']
      let filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
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
