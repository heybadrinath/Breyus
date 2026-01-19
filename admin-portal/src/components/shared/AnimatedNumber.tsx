import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  /** The target number to animate to */
  value: number
  /** Duration of animation in milliseconds */
  duration?: number
  /** Format function (e.g., for currency, percentages) */
  format?: (value: number) => string
  /** Additional class names */
  className?: string
  /** Prefix (e.g., "$") */
  prefix?: string
  /** Suffix (e.g., "%", "K") */
  suffix?: string
}

/**
 * AnimatedNumber - Displays a number with a smooth count-up animation
 *
 * Creates a premium feel for stats and metrics by animating number changes.
 * Uses requestAnimationFrame for smooth 60fps animations.
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  format,
  className,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)

  useEffect(() => {
    const startValue = displayValue
    const difference = value - startValue

    const animate = (currentTime: number) => {
      if (startTime.current === null) {
        startTime.current = currentTime
      }

      const elapsed = currentTime - startTime.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + difference * easeOut

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    startTime.current = null
    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [value, duration])

  const formattedValue = format
    ? format(Math.round(displayValue))
    : Math.round(displayValue).toLocaleString()

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}
