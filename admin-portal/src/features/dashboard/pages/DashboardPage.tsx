import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from '../components/StatsCards'
import { PendingActions } from '../components/PendingActions'
import { LiveActivityFeed } from '../components/LiveActivityFeed'
import { useDashboardStats, usePendingActions, useTradesByStatus } from '../hooks/useDashboardStats'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PageTransition } from '@/components/shared/PageTransition'
import { EmptyState } from '@/components/shared/EmptyState'
import { PieChartIcon } from 'lucide-react'

// Trade phase colors - vibrant, professional color palette
const STATUS_COLORS: Record<string, string> = {
  // Trade lifecycle phases (UPPERCASE as stored in DB)
  PR: '#3b82f6',         // Blue - Purchase Request (start)
  SCO: '#8b5cf6',        // Purple - Soft Corporate Offer
  ICPO: '#ec4899',       // Pink - Irrevocable Corporate Purchase Order
  SPA: '#f59e0b',        // Amber - Sales Purchase Agreement
  PAYMENT: '#06b6d4',    // Cyan - Payment stage
  BOL: '#10b981',        // Emerald - Bill of Lading
  COMPLETED: '#22c55e',  // Green - Completed trades
  CANCELLED: '#64748b',  // Slate - Cancelled trades
  // Negotiation statuses (lowercase)
  pending: '#f59e0b',
  negotiating: '#818cf8',
  accepted: '#10b981',
  rejected: '#ef4444',
  cancelled: '#64748b',
}

const STATUS_LABELS: Record<string, string> = {
  // Trade lifecycle phases
  PR: 'Purchase Request',
  SCO: 'SCO Pending',
  ICPO: 'ICPO Pending',
  SPA: 'SPA Review',
  PAYMENT: 'Awaiting Payment',
  BOL: 'BoL Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  // Negotiation statuses
  pending: 'Pending',
  negotiating: 'Negotiating',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: pendingActions, isLoading: actionsLoading } = usePendingActions()
  const { data: tradesByStatus } = useTradesByStatus()

  // Filter out null/undefined statuses and format the data
  const pieData = tradesByStatus
    ?.filter((item) => item.status && item.count > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      fill: STATUS_COLORS[item.status] || '#64748b',
    })) || []

  // Check if we have valid data to display
  const hasValidPieData = pieData.length > 0 && pieData.some(d => d.value > 0)

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to the Breyus Admin Portal
          </p>
        </div>

        {/* Stats Grid */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Actions */}
          <PendingActions data={pendingActions} isLoading={actionsLoading} />

          {/* Trades by Status Chart */}
          <Card hover>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                </div>
                Trades by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasValidPieData ? (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        animationDuration={200}
                        animationEasing="ease-out"
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            const total = pieData.reduce((sum, item) => sum + item.value, 0)
                            const percentage = ((data.value as number / total) * 100).toFixed(1)
                            return (
                              <div
                                className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-4 py-3 animate-in fade-in-0 zoom-in-95 duration-200"
                                style={{
                                  boxShadow: `0 4px 20px rgba(0,0,0,0.15), 0 0 15px ${data.payload?.fill || '#000'}20`,
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: data.payload?.fill }}
                                  />
                                  <p className="font-semibold text-foreground">{data.name}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">{data.value}</span> trades • <span className="font-medium text-foreground">{percentage}%</span>
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={50}
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => (
                          <span className="text-xs font-medium text-muted-foreground ml-1">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label with total */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-25px' }}>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">
                        {pieData.reduce((sum, item) => sum + item.value, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={PieChartIcon}
                  title="No trade data"
                  description="Trade statistics will appear here once trades are created."
                  className="h-[300px]"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <LiveActivityFeed />
      </div>
    </PageTransition>
  )
}
