import { cn } from '@/lib/utils'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from './AnimatedNumber'
import { Sparkline } from './Sparkline'

interface PremiumStatCardProps {
  /** Card title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Numeric value to display */
  value: number
  /** Percentage change from previous period */
  change?: number
  /** Label for the change indicator (e.g., "vs last month") */
  changeLabel?: string
  /** Icon to display */
  icon: LucideIcon
  /** Icon color class (e.g., "text-blue-500") */
  iconColor?: string
  /** Icon background color class (e.g., "bg-blue-500/10") */
  iconBgColor?: string
  /** Sparkline data points for trend visualization */
  sparklineData?: number[]
  /** Prefix for value (e.g., "$") */
  prefix?: string
  /** Suffix for value (e.g., "%", "K", "M") */
  suffix?: string
  /** Format function for the value */
  formatValue?: (value: number) => string
  /** Whether the card is in loading state */
  isLoading?: boolean
  /** Additional class names for the card */
  className?: string
  /** Animation duration in ms */
  animationDuration?: number
}

/**
 * PremiumStatCard - A premium stat card with animations, sparklines, and hover effects
 *
 * Designed to match the dashboard's premium aesthetic with:
 * - Animated number counting
 * - Sparkline trend visualization
 * - Percentage change indicators with arrows
 * - Icon with colored background
 * - Hover lift effect with shadow
 * - Loading skeleton state
 */
export function PremiumStatCard({
  title,
  subtitle,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  sparklineData,
  prefix = '',
  suffix = '',
  formatValue,
  isLoading = false,
  className,
  animationDuration = 800,
}: PremiumStatCardProps) {
  // Format the display value
  const displayValue = formatValue ? parseFloat(formatValue(value)) : value
  const displaySuffix = formatValue ? '' : suffix

  if (isLoading) {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-28" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      hover
      className={cn(
        'transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* Title and optional subtitle */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Animated value */}
            <div className="text-3xl font-bold text-foreground tracking-tight">
              <AnimatedNumber
                value={displayValue}
                duration={animationDuration}
                prefix={prefix}
                suffix={displaySuffix}
              />
              {formatValue && suffix && (
                <span className="text-2xl">{suffix}</span>
              )}
            </div>

            {/* Change indicator with sparkline */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                {change !== undefined && change !== 0 && (
                  <>
                    {change > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        change > 0 ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {Math.abs(change)}%
                    </span>
                  </>
                )}
                {(change !== undefined || changeLabel) && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>

              {/* Sparkline trend chart */}
              {sparklineData && sparklineData.length > 1 && (
                <Sparkline
                  data={sparklineData}
                  width={60}
                  height={20}
                />
              )}
            </div>
          </div>

          {/* Icon with colored background */}
          <div
            className={cn(
              'p-3 rounded-xl transition-transform duration-200',
              'group-hover:scale-105',
              iconBgColor
            )}
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * PremiumStatCardGrid - A responsive grid wrapper for stat cards
 *
 * Use this to wrap multiple PremiumStatCard components with consistent spacing
 */
export function PremiumStatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
}
