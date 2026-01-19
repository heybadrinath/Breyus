import { useState, useMemo } from 'react'
import { format, subDays, startOfYear } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Download,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Clock,
  FileCheck,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import {
  useOverviewMetrics,
  useTradeAnalytics,
  useUserAnalytics,
  useFinancialAnalytics,
  useOperationalMetrics,
  useExportAnalytics,
} from '../hooks/useAnalytics'
import type { DateRangePreset, AnalyticsQueryParams, ExportParams } from '../types'

// Color palette for charts
const COLORS = {
  primary: '#4f46e5',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
}

const PHASE_COLORS: Record<string, string> = {
  PR: '#f59e0b',
  SCO: '#3b82f6',
  ICPO: '#8b5cf6',
  SPA: '#ec4899',
  PAYMENT: '#06b6d4',
  BOL: '#10b981',
  COMPLETED: '#22c55e',
}

const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

// ============================================================================
// DATE RANGE SELECTOR
// ============================================================================

interface DateRangeSelectorProps {
  preset: DateRangePreset
  onChange: (preset: DateRangePreset) => void
}

function DateRangeSelector({ preset, onChange }: DateRangeSelectorProps) {
  return (
    <Select value={preset} onValueChange={(v) => onChange(v as DateRangePreset)}>
      <SelectTrigger className="w-[160px]">
        <Calendar className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="ytd">Year to date</SelectItem>
      </SelectContent>
    </Select>
  )
}

// ============================================================================
// EXPORT BUTTON
// ============================================================================

interface ExportButtonProps {
  params: AnalyticsQueryParams
}

function ExportButton({ params }: ExportButtonProps) {
  const { toast } = useToast()
  const exportMutation = useExportAnalytics()

  const handleExport = (type: 'csv' | 'pdf', section: ExportParams['section']) => {
    exportMutation.mutate(
      { type, section, startDate: params.startDate, endDate: params.endDate },
      {
        onSuccess: (result) => {
          toast({
            title: 'Export Complete',
            description: `Downloaded ${result.filename}`,
          })
        },
        onError: () => {
          toast({
            title: 'Export Failed',
            description: 'Failed to generate export. Please try again.',
            variant: 'destructive',
          })
        },
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exportMutation.isPending}>
          {exportMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv', 'all')}>
          Export All (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'all')}>
          Export All (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'trades')}>
          Trade Analytics (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'users')}>
          User Analytics (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv', 'financial')}>
          Financial Analytics (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function AnalyticsPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d')

  // Calculate date range from preset
  const dateParams = useMemo<AnalyticsQueryParams>(() => {
    const endDate = new Date()
    let startDate: Date

    switch (datePreset) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      case 'ytd':
        startDate = startOfYear(endDate)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }
  }, [datePreset])

  // Fetch all analytics data
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useOverviewMetrics(dateParams)
  const { data: trades, isLoading: tradesLoading, refetch: refetchTrades } = useTradeAnalytics(dateParams)
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useUserAnalytics(dateParams)
  const { data: financial, isLoading: financialLoading, refetch: refetchFinancial } = useFinancialAnalytics(dateParams)
  const { data: operational, isLoading: operationalLoading, refetch: refetchOperational } = useOperationalMetrics()

  const isLoading = overviewLoading || tradesLoading || usersLoading || financialLoading || operationalLoading

  // Generate sparkline data for overview metrics
  const sparklineData = useMemo(() => ({
    users: generateMockSparklineData(7, overview?.users.total ?? 100, 0.08),
    trades: generateMockSparklineData(7, overview?.trades.total ?? 50, 0.12),
    revenue: generateMockSparklineData(7, overview?.revenue.total ?? 10000, 0.15),
    products: generateMockSparklineData(7, overview?.products.total ?? 80, 0.1),
  }), [overview])

  const handleRefresh = () => {
    refetchOverview()
    refetchTrades()
    refetchUsers()
    refetchFinancial()
    refetchOperational()
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics Hub</h1>
          <p className="text-muted-foreground">
            Platform-wide metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector preset={datePreset} onChange={setDatePreset} />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <ExportButton params={dateParams} />
        </div>
      </div>

      {/* Overview Metrics */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Users"
          subtitle={`${overview?.users.active || 0} active`}
          value={overview?.users.total ?? 0}
          change={overview?.users.change}
          changeLabel="vs previous period"
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.users}
          isLoading={overviewLoading}
        />
        <PremiumStatCard
          title="Total Trades"
          subtitle={`${overview?.trades.completed || 0} completed`}
          value={overview?.trades.total ?? 0}
          change={overview?.trades.change}
          changeLabel="vs previous period"
          icon={ShoppingCart}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
          sparklineData={sparklineData.trades}
          isLoading={overviewLoading}
        />
        <PremiumStatCard
          title="Revenue"
          subtitle="Total platform value"
          value={overview?.revenue.total ?? 0}
          change={overview?.revenue.change}
          changeLabel="vs previous period"
          icon={DollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.revenue}
          prefix="$"
          isLoading={overviewLoading}
        />
        <PremiumStatCard
          title="Products"
          subtitle="Active listings"
          value={overview?.products.total ?? 0}
          change={overview?.products.change}
          changeLabel="vs previous period"
          icon={Package}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={sparklineData.products}
          isLoading={overviewLoading}
        />
      </PremiumStatCardGrid>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trades">Trade</TabsTrigger>
          <TabsTrigger value="users">User</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
        </TabsList>

        {/* Trade Analytics Tab */}
        <TabsContent value="trades" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Trade Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Volume Over Time</CardTitle>
                <CardDescription>Number of trades created per day</CardDescription>
              </CardHeader>
              <CardContent>
                {trades?.timeSeries && trades.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trades.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={false}
                        name="Trades"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Funnel</CardTitle>
                <CardDescription>
                  Completion rate: {trades?.completionRate || 0}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trades?.funnel && trades.funnel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trades.funnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="phase" type="category" fontSize={12} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Trades">
                        {trades.funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.phase] || COLORS.muted} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Timings */}
            <Card>
              <CardHeader>
                <CardTitle>Average Phase Duration</CardTitle>
                <CardDescription>Days spent in each phase transition</CardDescription>
              </CardHeader>
              <CardContent>
                {trades?.phaseTimings && trades.phaseTimings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trades.phaseTimings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="avgDays" fill={COLORS.secondary} name="Avg Days" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Top Rejection Reasons</CardTitle>
                <CardDescription>Most common reasons for trade rejections</CardDescription>
              </CardHeader>
              <CardContent>
                {trades?.rejectionReasons && trades.rejectionReasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          trades.rejectionReasons as unknown as Array<Record<string, number | string>>
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="reason"
                        label={({ name, percent }) => {
                          const percentValue = typeof percent === 'number' ? percent : 0
                          const reasonLabel = typeof name === 'string' ? name : String(name)
                          return `${reasonLabel.substring(0, 15)}... ${(percentValue * 100).toFixed(0)}%`
                        }}
                      >
                        {trades.rejectionReasons.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No rejections recorded
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Registrations */}
            <Card>
              <CardHeader>
                <CardTitle>User Registrations</CardTitle>
                <CardDescription>
                  Activation rate: {users?.activationRate || 0}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users?.registrations && users.registrations.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={users.registrations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.2}
                        name="Registrations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Buyer vs Seller ratio</CardDescription>
              </CardHeader>
              <CardContent>
                {users?.roleDistribution && users.roleDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          users.roleDistribution as unknown as Array<Record<string, number | string>>
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="role"
                        label={({ name, percent }) => {
                          const percentValue = typeof percent === 'number' ? percent : 0
                          const roleLabel = typeof name === 'string' ? name : String(name)
                          return `${roleLabel} ${(percentValue * 100).toFixed(0)}%`
                        }}
                      >
                        {users.roleDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by country</CardDescription>
              </CardHeader>
              <CardContent>
                {users?.geographic && users.geographic.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={users.geographic.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="country" type="category" fontSize={12} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.tertiary} name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Onboarding Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Funnel</CardTitle>
                <CardDescription>User drop-off by onboarding step</CardDescription>
              </CardHeader>
              <CardContent>
                {users?.onboardingFunnel && users.onboardingFunnel.length > 0 ? (
                  <div className="space-y-4">
                    {users.onboardingFunnel.map((step) => (
                      <div key={step.step} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{step.step}</span>
                          <span className="font-medium">{step.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(step.count / (users.onboardingFunnel[0]?.count || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        {step.dropoff > 0 && (
                          <p className="text-xs text-red-500">-{step.dropoff}% dropoff</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>
                  Avg deal size: {formatCurrency(financial?.avgDealSize || 0)}
                  {financial?.avgDealSizeChange !== undefined && (
                    <span className={financial.avgDealSizeChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {' '}({financial.avgDealSizeChange >= 0 ? '+' : ''}{financial.avgDealSizeChange}%)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {financial?.valueTimeSeries && financial.valueTimeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={financial.valueTimeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(typeof value === 'number' ? value : Number(value ?? 0))
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS.secondary}
                        fill={COLORS.secondary}
                        fillOpacity={0.2}
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Value by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Value by Category</CardTitle>
                <CardDescription>Trade value distribution by product category</CardDescription>
              </CardHeader>
              <CardContent>
                {financial?.byCategory && financial.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financial.byCategory.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(typeof value === 'number' ? value : Number(value ?? 0))
                        }
                      />
                      <Bar dataKey="value" fill={COLORS.purple} name="Value" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Value by Incoterm */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Trade Value by Incoterm</CardTitle>
                <CardDescription>Distribution of trade value across Incoterms</CardDescription>
              </CardHeader>
              <CardContent>
                {financial?.byIncoterm && financial.byIncoterm.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financial.byIncoterm}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="incoterm" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip
                        formatter={(value, name) =>
                          name === 'Value'
                            ? formatCurrency(typeof value === 'number' ? value : Number(value ?? 0))
                            : value ?? 0
                        }
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="value" fill={COLORS.primary} name="Value" />
                      <Bar yAxisId="right" dataKey="count" fill={COLORS.tertiary} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operational Metrics Tab */}
        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* KYC Backlog */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KYC Backlog</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operational?.kycBacklog.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  pending documents
                </p>
                <p className="text-sm mt-2">
                  Avg wait: <span className="font-medium">{operational?.kycBacklog.avgWaitDays || 0} days</span>
                </p>
              </CardContent>
            </Card>

            {/* Document Processing */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Document Processing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operational?.documentProcessing.avgHours || 0}h</div>
                <p className="text-xs text-muted-foreground">
                  average processing time
                </p>
              </CardContent>
            </Card>

            {/* Stalled Trades */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stalled Trades</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {operational?.stalledTrades.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  stuck &gt;{operational?.stalledTrades.threshold || 7} days
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
