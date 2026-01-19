import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * PageTransition - Wraps page content with a smooth fade + slide animation
 *
 * This creates a premium feel by animating page content on mount.
 * Uses CSS animations defined in tailwind.config.js for performance.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('animate-slide-up', className)}>
      {children}
    </div>
  )
}
