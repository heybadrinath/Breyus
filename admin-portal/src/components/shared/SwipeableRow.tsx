import { useState, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwipeAction {
  /** Unique identifier */
  id: string
  /** Label text */
  label: string
  /** Icon to show */
  icon: ReactNode
  /** Background color class */
  bgColor: string
  /** Text color class */
  textColor?: string
  /** Action handler */
  onClick: () => void
}

interface SwipeableRowProps {
  /** The main content of the row */
  children: ReactNode
  /** Actions to show on left swipe */
  leftActions?: SwipeAction[]
  /** Actions to show on right swipe */
  rightActions?: SwipeAction[]
  /** How far to swipe to trigger (in pixels) */
  threshold?: number
  /** Additional class names */
  className?: string
  /** Whether swipe is disabled */
  disabled?: boolean
}

/**
 * SwipeableRow - Swipeable row with reveal actions
 *
 * Provides touch-friendly swipe gestures for mobile devices
 * to reveal contextual actions without cluttering the UI.
 */
export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 60,
  className,
  disabled = false,
}: SwipeableRowProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const leftActionsWidth = leftActions.length * 72
  const rightActionsWidth = rightActions.length * 72

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      startX.current = e.touches[0].clientX
      currentX.current = startX.current
      setIsDragging(true)
    },
    [disabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return

      currentX.current = e.touches[0].clientX
      const diff = currentX.current - startX.current

      // Limit swipe distance
      let newTranslate = diff
      if (diff > 0) {
        // Swiping right (reveal left actions)
        newTranslate = Math.min(diff, leftActionsWidth)
      } else {
        // Swiping left (reveal right actions)
        newTranslate = Math.max(diff, -rightActionsWidth)
      }

      // Apply rubber-band effect at limits
      if (Math.abs(diff) > (diff > 0 ? leftActionsWidth : rightActionsWidth)) {
        const overflow = Math.abs(diff) - (diff > 0 ? leftActionsWidth : rightActionsWidth)
        const dampening = 0.3
        newTranslate = (diff > 0 ? 1 : -1) * ((diff > 0 ? leftActionsWidth : rightActionsWidth) + overflow * dampening)
      }

      setTranslateX(newTranslate)
    },
    [isDragging, disabled, leftActionsWidth, rightActionsWidth]
  )

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const diff = currentX.current - startX.current

    // Snap to open or close position
    if (diff > threshold && leftActions.length > 0) {
      setTranslateX(leftActionsWidth)
    } else if (diff < -threshold && rightActions.length > 0) {
      setTranslateX(-rightActionsWidth)
    } else {
      setTranslateX(0)
    }
  }, [isDragging, threshold, leftActions, rightActions, leftActionsWidth, rightActionsWidth])

  const handleActionClick = useCallback((action: SwipeAction) => {
    action.onClick()
    setTranslateX(0)
  }, [])

  const resetPosition = useCallback(() => {
    setTranslateX(0)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-pan-y', className)}
    >
      {/* Left actions (revealed on right swipe) */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex"
          style={{ width: leftActionsWidth }}
        >
          {leftActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 px-4',
                action.bgColor,
                action.textColor || 'text-white'
              )}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed on left swipe) */}
      {rightActions.length > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ width: rightActionsWidth }}
        >
          {rightActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 px-4',
                action.bgColor,
                action.textColor || 'text-white'
              )}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'relative bg-background',
          !isDragging && 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={translateX !== 0 ? resetPosition : undefined}
      >
        {children}
      </div>

      {/* Invisible overlay to close when tapped outside */}
      {translateX !== 0 && (
        <div
          className="fixed inset-0 z-10"
          onClick={resetPosition}
        />
      )}
    </div>
  )
}

/**
 * Pre-built swipe action configurations
 */
export const SwipeActionPresets = {
  suspend: (onClick: () => void): SwipeAction => ({
    id: 'suspend',
    label: 'Suspend',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    bgColor: 'bg-amber-500',
    onClick,
  }),

  delete: (onClick: () => void): SwipeAction => ({
    id: 'delete',
    label: 'Delete',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    bgColor: 'bg-red-500',
    onClick,
  }),

  verify: (onClick: () => void): SwipeAction => ({
    id: 'verify',
    label: 'Verify',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-emerald-500',
    onClick,
  }),

  edit: (onClick: () => void): SwipeAction => ({
    id: 'edit',
    label: 'Edit',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    bgColor: 'bg-blue-500',
    onClick,
  }),
}
