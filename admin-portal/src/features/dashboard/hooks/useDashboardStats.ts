import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DashboardStats {
  totalUsers: number
  totalUsersChange: number
  activeTrades: number
  activeTradesChange: number
  totalCompanies: number
  totalCompaniesChange: number
  totalProducts: number
  monthlyVolume: number
  monthlyVolumeChange: number
  pendingKyc: number
  pendingDisputes: number
  stalledTrades: number
}

interface DashboardStatsResponse {
  statusCode: number
  message: string
  data: DashboardStats
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStatsResponse>('/admin/dashboard/stats')
      return data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export interface PendingActions {
  kyc: {
    count: number
    items: Array<{
      _id: string
      companyName: string
      email: string
      createdAt: string
    }>
  }
  disputes: {
    count: number
    items: Array<{
      _id: string
      raisedByEmail: string
      reason: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      status: 'open' | 'under_review'
      createdAt: string
    }>
  }
  stalledTrades: {
    count: number
    items: Array<{
      _id: string
      tradeId: string
      status: string
      updatedAt: string
    }>
  }
}

interface PendingActionsResponse {
  statusCode: number
  message: string
  data: PendingActions
}

export function usePendingActions() {
  return useQuery({
    queryKey: ['dashboard', 'pending-actions'],
    queryFn: async () => {
      const { data } = await api.get<PendingActionsResponse>('/admin/dashboard/pending-actions')
      return data.data
    },
    refetchInterval: 60000, // Refresh every minute
  })
}

export interface TradesByStatus {
  status: string
  count: number
}

interface TradesByStatusResponse {
  statusCode: number
  message: string
  data: TradesByStatus[]
}

export function useTradesByStatus() {
  return useQuery({
    queryKey: ['dashboard', 'trades-by-status'],
    queryFn: async () => {
      const { data } = await api.get<TradesByStatusResponse>('/admin/dashboard/trades-by-status')
      return data.data
    },
  })
}
