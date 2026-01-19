import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** Icon to display - defaults to Inbox */
  icon?: LucideIcon
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Additional class names */
  className?: string
  /** Children for custom content below description */
  children?: ReactNode
}

/**
 * EmptyState - A reusable empty state component with icon, title, and optional action
 *
 * Used when there's no data to display (empty tables, no search results, etc.)
 * Features a subtle animation and consistent styling across the app.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        'animate-fade-in',
        className
      )}
    >
      {/* Icon with gradient background */}
      <div className="mb-4 relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* Custom children */}
      {children}

      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
