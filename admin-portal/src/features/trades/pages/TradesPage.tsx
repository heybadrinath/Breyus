import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  MessageSquare,
  MoreHorizontal,
  FileText,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import { useTrades, useTradeStats } from '../hooks/useTrades'
import type { Trade, TradesQueryParams } from '../types'

// Helper to get phase badge color (dark mode compatible)
function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'PR':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'SCO':
    case 'ICPO':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'SPA':
    case 'PAYMENT':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    case 'BOL':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

// Helper to get negotiation status badge color (dark mode compatible)
function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'countered':
    case 'buyer_responded':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'accepted':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    case 'rejected':
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function TradesPage() {
  const navigate = useNavigate()

  // Query params state
  const [params, setParams] = useState<TradesQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  // Queries
  const { data, isLoading, error } = useTrades(params)
  const { data: stats, isLoading: statsLoading } = useTradeStats()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.totalTrades ?? 100, 0.1),
    active: generateMockSparklineData(7, stats?.activeTrades ?? 50, 0.15),
    completed: generateMockSparklineData(7, stats?.completedTrades ?? 30, 0.12),
    issues: generateMockSparklineData(7, (stats?.stalledTrades ?? 0) + (stats?.disputedTrades ?? 0), 0.2),
  }), [stats])

  const handleSearch = () => {
    setParams(prev => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handlePhaseFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      tradePhase: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleStatusFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      negotiationStatus: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleStalledFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      isStalled: value === 'all' ? undefined : value === 'true',
      page: 1,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Trades</h1>
        <p className="text-muted-foreground">Manage and monitor all platform trades</p>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Trades"
          subtitle="All platform trades"
          value={stats?.totalTrades ?? 0}
          icon={FileText}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Active Trades"
          subtitle="In progress"
          value={stats?.activeTrades ?? 0}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
          sparklineData={sparklineData.active}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Completed"
          subtitle="Successfully closed"
          value={stats?.completedTrades ?? 0}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.completed}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Issues"
          subtitle={`${stats?.stalledTrades ?? 0} stalled, ${stats?.disputedTrades ?? 0} disputed`}
          value={(stats?.stalledTrades ?? 0) + (stats?.disputedTrades ?? 0)}
          icon={AlertTriangle}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={sparklineData.issues}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by trade ID or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Phase Filter */}
            <Select value={params.tradePhase || 'all'} onValueChange={handlePhaseFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="PR">PR</SelectItem>
                <SelectItem value="SCO">SCO</SelectItem>
                <SelectItem value="ICPO">ICPO</SelectItem>
                <SelectItem value="SPA">SPA</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="BOL">BoL</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={params.negotiationStatus || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="countered">Countered</SelectItem>
                <SelectItem value="buyer_responded">Buyer Responded</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Stalled Filter */}
            <Select value={params.isStalled === undefined ? 'all' : String(params.isStalled)} onValueChange={handleStalledFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stalled" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="true">Stalled Only</SelectItem>
                <SelectItem value="false">Not Stalled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trades ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load trades
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Buyer</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Seller</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phase</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Flags</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Updated</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.trades.map((trade: Trade) => (
                      <tr
                        key={trade._id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/trades/${trade._id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="max-w-[200px] truncate font-medium">
                            {trade.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trade.quantity} {trade.quantityUnit}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{trade.buyer?.mail || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {trade.buyer?.company?.companyName || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{trade.seller?.mail || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {trade.seller?.company?.companyName || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getPhaseColor(trade.tradePhase)}>
                            {trade.tradePhase}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getStatusColor(trade.negotiationStatus)}>
                            {trade.negotiationStatus.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {trade.isStalled && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Stalled
                              </Badge>
                            )}
                            {trade.activeDispute && (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Dispute
                              </Badge>
                            )}
                            {trade.adminNotes?.length > 0 && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                {trade.adminNotes.length} notes
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(trade.updatedAt).toLocaleDateString()}
                          {trade.daysSincePhaseChange !== undefined && (
                            <div className="text-xs">
                              {trade.daysSincePhaseChange} days in phase
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/trades/${trade._id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {trade.activeDispute && (
                                <DropdownMenuItem onClick={() => navigate(`/disputes/${trade.activeDispute?._id}`)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  View Dispute
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {data?.trades.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No trades found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
