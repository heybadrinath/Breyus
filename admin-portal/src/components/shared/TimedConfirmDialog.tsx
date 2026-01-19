import { useState, useEffect, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface TimedConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  /** Countdown duration in seconds before confirm is enabled */
  countdownSeconds?: number
  /** Variant for styling */
  variant?: 'default' | 'destructive'
  /** Whether the action is currently loading */
  loading?: boolean
}

/**
 * TimedConfirmDialog - Confirmation dialog with countdown timer
 *
 * Forces users to wait before confirming destructive actions,
 * reducing accidental clicks and encouraging careful consideration.
 */
export function TimedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  countdownSeconds = 3,
  variant = 'default',
  loading = false,
}: TimedConfirmDialogProps) {
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [canConfirm, setCanConfirm] = useState(false)

  // Reset countdown when dialog opens
  useEffect(() => {
    if (open) {
      setCountdown(countdownSeconds)
      setCanConfirm(false)
    }
  }, [open, countdownSeconds])

  // Countdown timer
  useEffect(() => {
    if (!open || canConfirm) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanConfirm(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open, canConfirm])

  const handleConfirm = useCallback(() => {
    if (canConfirm && !loading) {
      onConfirm()
    }
  }, [canConfirm, loading, onConfirm])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={cn(
              variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : canConfirm ? (
              confirmLabel
            ) : (
              <span className="flex items-center gap-2">
                {confirmLabel}
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-background/20">
                  {countdown}
                </span>
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Helper hook for using TimedConfirmDialog
 */
export function useTimedConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default',
  })

  const confirm = useCallback(
    (options: {
      title: string
      description: string
      onConfirm: () => void
      variant?: 'default' | 'destructive'
    }) => {
      setState({
        open: true,
        ...options,
      })
    },
    []
  )

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    state,
    confirm,
    close,
    setOpen: (open: boolean) => setState((prev) => ({ ...prev, open })),
  }
}
