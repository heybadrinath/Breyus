import { cn } from '@/lib/utils'

interface TooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  /** Whether the tooltip is active */
  active?: boolean
  /** The payload data from Recharts */
  payload?: TooltipPayloadItem[]
  /** The label (usually x-axis value) */
  label?: string
  /** Custom formatter for values */
  valueFormatter?: (value: number | string, name?: string) => string
  /** Custom formatter for labels */
  labelFormatter?: (label: string) => string
  /** Title to show above the content */
  title?: string
  /** Additional class names */
  className?: string
  /** Whether to show color indicators */
  showColorIndicators?: boolean
  /** Whether to show percentages (for pie charts) */
  showPercentage?: boolean
  /** Total value (for calculating percentages) */
  total?: number
}

/**
 * ChartTooltip - A premium tooltip component for Recharts
 *
 * Features:
 * - Smooth fade-in animation (200ms)
 * - Subtle shadow + border
 * - Rounded corners (8px)
 * - Theme-aware colors
 * - Optional color indicators
 * - Percentage display for pie charts
 *
 * Usage with Recharts:
 * ```tsx
 * <Tooltip content={<ChartTooltip />} />
 * ```
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  title,
  className,
  showColorIndicators = true,
  showPercentage = false,
  total,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg',
        'px-3 py-2.5 min-w-[140px]',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      {/* Title */}
      {title && (
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          {title}
        </p>
      )}

      {/* Label */}
      {formattedLabel && (
        <p className="font-medium text-foreground text-sm mb-1.5">
          {formattedLabel}
        </p>
      )}

      {/* Payload items */}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const value = valueFormatter
            ? valueFormatter(item.value ?? 0, item.name)
            : typeof item.value === 'number'
              ? item.value.toLocaleString()
              : item.value

          const percentage =
            showPercentage && total && typeof item.value === 'number'
              ? ((item.value / total) * 100).toFixed(1)
              : null

          return (
            <div
              key={`tooltip-item-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                {showColorIndicators && item.color && (
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {item.name || item.dataKey}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {value}
                {percentage && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({percentage}%)
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * SimpleChartTooltip - A simplified tooltip for single-value charts
 */
export function SimpleChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  valueSuffix = '',
  className,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  valueFormatter?: (value: number) => string
  valueSuffix?: string
  className?: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const item = payload[0]
  const value =
    typeof item.value === 'number'
      ? valueFormatter
        ? valueFormatter(item.value)
        : item.value.toLocaleString()
      : item.value

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg',
        'px-3 py-2',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      {label && (
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      )}
      <p className="font-semibold text-foreground">
        {value}
        {valueSuffix}
      </p>
    </div>
  )
}

/**
 * PieChartTooltip - A specialized tooltip for pie/donut charts
 */
export function PieChartTooltip({
  active,
  payload,
  total,
  valueFormatter,
  className,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  total: number
  valueFormatter?: (value: number) => string
  className?: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const item = payload[0]
  const value = typeof item.value === 'number' ? item.value : 0
  const percentage = ((value / total) * 100).toFixed(1)
  const formattedValue = valueFormatter
    ? valueFormatter(value)
    : value.toLocaleString()

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg',
        'px-3 py-2.5',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {item.color && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
        )}
        <p className="font-medium text-foreground">{item.name}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {formattedValue}{' '}
        <span className="text-muted-foreground/70">({percentage}%)</span>
      </p>
    </div>
  )
}
