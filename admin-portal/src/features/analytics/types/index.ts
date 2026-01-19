// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface AnalyticsQueryParams {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}

export interface ExportParams {
  type: 'csv' | 'pdf'
  section: 'all' | 'overview' | 'trades' | 'users' | 'financial'
  startDate?: string
  endDate?: string
}

// ============================================================================
// PLATFORM OVERVIEW
// ============================================================================

export interface MetricWithChange {
  total: number
  change: number
}

export interface UsersMetrics {
  total: number
  active: number
  new: number
  change: number
}

export interface TradesMetrics {
  total: number
  active: number
  completed: number
  change: number
}

export interface PlatformOverview {
  users: UsersMetrics
  trades: TradesMetrics
  products: MetricWithChange
  revenue: MetricWithChange
}

// ============================================================================
// TRADE ANALYTICS
// ============================================================================

export interface TradeTimeSeries {
  date: string
  count: number
  value: number
}

export interface TradeFunnel {
  phase: string
  count: number
}

export interface PhaseTiming {
  phase: string
  avgDays: number
}

export interface RejectionReason {
  reason: string
  count: number
}

export interface TradeAnalytics {
  timeSeries: TradeTimeSeries[]
  funnel: TradeFunnel[]
  phaseTimings: PhaseTiming[]
  rejectionReasons: RejectionReason[]
  completionRate: number
}

// ============================================================================
// USER ANALYTICS
// ============================================================================

export interface UserRegistration {
  date: string
  count: number
}

export interface RoleDistribution {
  role: string
  count: number
}

export interface GeographicDistribution {
  country: string
  count: number
}

export interface OnboardingFunnelStep {
  step: string
  count: number
  dropoff: number
}

export interface UserAnalytics {
  registrations: UserRegistration[]
  roleDistribution: RoleDistribution[]
  geographic: GeographicDistribution[]
  onboardingFunnel: OnboardingFunnelStep[]
  activationRate: number
}

// ============================================================================
// FINANCIAL ANALYTICS
// ============================================================================

export interface ValueTimeSeries {
  date: string
  value: number
}

export interface CategoryValue {
  category: string
  value: number
}

export interface IncotermUsage {
  incoterm: string
  value: number
  count: number
}

export interface FinancialAnalytics {
  valueTimeSeries: ValueTimeSeries[]
  avgDealSize: number
  avgDealSizeChange: number
  byCategory: CategoryValue[]
  byIncoterm: IncotermUsage[]
}

// ============================================================================
// OPERATIONAL METRICS
// ============================================================================

export interface KycBacklog {
  pending: number
  avgWaitDays: number
}

export interface DocumentProcessingByType {
  type: string
  avgHours: number
}

export interface DocumentProcessing {
  avgHours: number
  byType: DocumentProcessingByType[]
}

export interface StalledTrades {
  count: number
  threshold: number
}

export interface OperationalMetrics {
  kycBacklog: KycBacklog
  documentProcessing: DocumentProcessing
  stalledTrades: StalledTrades
}

// ============================================================================
// DATE RANGE PRESETS
// ============================================================================

export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom'

export interface DateRange {
  startDate: string
  endDate: string
  preset: DateRangePreset
}
