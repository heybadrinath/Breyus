import { cn } from '@/lib/utils'

interface SparklineProps {
  /** Array of data points (values) */
  data: number[]
  /** Width of the sparkline */
  width?: number
  /** Height of the sparkline */
  height?: number
  /** Whether to show area fill under the line */
  showArea?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Sparkline - A minimal inline chart showing data trends
 *
 * Creates an SVG path from data points, perfect for showing
 * trend information in stat cards without taking much space.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  showArea = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return null
  }

  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Normalize data to fit within the chart bounds
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1 // Prevent division by zero

  // Generate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y }
  })

  // Create SVG path
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`

      // Use curve for smoother lines
      const prev = points[index - 1]
      const cpX = (prev.x + point.x) / 2
      return `Q ${cpX} ${prev.y} ${point.x} ${point.y}`
    })
    .join(' ')

  // Create area path (line + bottom edge)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  // Determine trend direction
  const trend = data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'flat'

  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    flat: 'text-muted-foreground',
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn(trendColors[trend], className)}
      aria-hidden="true"
    >
      {showArea && (
        <path
          d={areaPath}
          fill="currentColor"
          fillOpacity={0.1}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill="currentColor"
      />
    </svg>
  )
}

// Generate mock sparkline data for demo/loading purposes
export function generateMockSparklineData(length = 7, baseValue = 100, variance = 0.2): number[] {
  const data: number[] = []
  let current = baseValue

  for (let i = 0; i < length; i++) {
    current = current * (1 + (Math.random() - 0.5) * variance)
    data.push(Math.round(current))
  }

  return data
}
