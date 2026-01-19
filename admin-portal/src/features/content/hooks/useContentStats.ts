import { useQuery } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type { ContentStats } from '../types'

// Get overall content statistics for the overview dashboard
export function useContentStats() {
  return useQuery({
    queryKey: ['admin', 'content', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ContentStats>>(
        '/admin/content/stats'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
