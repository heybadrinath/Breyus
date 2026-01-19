import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface ShortcutItem {
  key: string
  description: string
  category?: 'navigation' | 'actions' | 'global'
}

interface ShortcutsHelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts?: ShortcutItem[]
}

// Detect if running on Mac
const isMac = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac')

/**
 * Format a key combination for display
 */
function formatKey(key: string): string[] {
  const parts = key.toLowerCase().split('+')
  return parts.map(part => {
    switch (part) {
      case 'mod':
      case 'cmd':
      case 'ctrl':
        return isMac ? '⌘' : 'Ctrl'
      case 'shift':
        return isMac ? '⇧' : 'Shift'
      case 'alt':
        return isMac ? '⌥' : 'Alt'
      case 'escape':
        return 'Esc'
      case 'enter':
        return '↵'
      case 'arrowup':
        return '↑'
      case 'arrowdown':
        return '↓'
      default:
        return part.toUpperCase()
    }
  })
}

/**
 * KeyboardKey - Renders a single keyboard key
 */
function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded border bg-muted text-xs font-mono font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  )
}

/**
 * Default shortcuts to display
 */
const defaultShortcuts: ShortcutItem[] = [
  { key: 'mod+k', description: 'Open search spotlight', category: 'global' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'global' },
  { key: 'Escape', description: 'Close dialogs and modals', category: 'global' },
  { key: 'r', description: 'Refresh current page data', category: 'actions' },
  { key: 'n', description: 'Create new item (context-aware)', category: 'actions' },
]

/**
 * ShortcutsHelpModal - Shows available keyboard shortcuts
 *
 * Groups shortcuts by category and displays them in a clean,
 * accessible modal dialog.
 */
export function ShortcutsHelpModal({
  open,
  onOpenChange,
  shortcuts = defaultShortcuts,
}: ShortcutsHelpModalProps) {
  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'global'
    if (!acc[category]) acc[category] = []
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, ShortcutItem[]>)

  const categoryLabels: Record<string, string> = {
    global: 'Global',
    navigation: 'Navigation',
    actions: 'Actions',
  }

  const categoryOrder = ['global', 'navigation', 'actions']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categoryOrder.map(category => {
            const items = grouped[category]
            if (!items?.length) return null

            return (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatKey(shortcut.key).map((keyPart, j) => (
                          <KeyboardKey key={j}>{keyPart}</KeyboardKey>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <KeyboardKey>?</KeyboardKey> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
