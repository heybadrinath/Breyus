import { useEffect, useCallback, useState } from 'react'

export interface KeyboardShortcut {
  /** Key combination (e.g., 'r', 'ctrl+k', 'mod+k') - 'mod' = Cmd on Mac, Ctrl on Windows */
  key: string
  /** Description shown in help modal */
  description: string
  /** Handler function */
  handler: () => void
  /** Whether this shortcut is enabled */
  enabled?: boolean
  /** Category for grouping in help modal */
  category?: 'navigation' | 'actions' | 'global'
}

interface UseKeyboardShortcutsOptions {
  /** Whether to enable shortcuts globally */
  enabled?: boolean
}

/**
 * useKeyboardShortcuts - Global keyboard shortcut management
 *
 * Registers keyboard shortcuts and provides a mechanism to
 * show/hide a help modal. Shortcuts are automatically cleaned
 * up when the component unmounts.
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options
  const [showHelp, setShowHelp] = useState(false)

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape to work in inputs
        if (event.key !== 'Escape') return
      }

      // Build the key string from the event
      const key = event.key.toLowerCase()
      const isMod = event.metaKey || event.ctrlKey
      const isShift = event.shiftKey
      const isAlt = event.altKey

      // Check each shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const parts = shortcut.key.toLowerCase().split('+')
        const shortcutKey = parts[parts.length - 1]
        const needsMod = parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd')
        const needsShift = parts.includes('shift')
        const needsAlt = parts.includes('alt')

        // Match the key
        if (key === shortcutKey) {
          // Check modifiers
          const modMatch = needsMod ? isMod : !isMod
          const shiftMatch = needsShift ? isShift : !isShift
          const altMatch = needsAlt ? isAlt : !isAlt

          if (modMatch && shiftMatch && altMatch) {
            event.preventDefault()
            shortcut.handler()
            return
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])

  return { showHelp, setShowHelp, toggleHelp }
}

/**
 * Default global shortcuts
 */
export function createGlobalShortcuts(handlers: {
  onRefresh?: () => void
  onSearch?: () => void
  onNew?: () => void
  onHelp?: () => void
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (handlers.onRefresh) {
    shortcuts.push({
      key: 'r',
      description: 'Refresh current page data',
      handler: handlers.onRefresh,
      category: 'actions',
    })
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'mod+k',
      description: 'Open search spotlight',
      handler: handlers.onSearch,
      category: 'global',
    })
  }

  if (handlers.onNew) {
    shortcuts.push({
      key: 'n',
      description: 'Create new item',
      handler: handlers.onNew,
      category: 'actions',
    })
  }

  if (handlers.onHelp) {
    shortcuts.push({
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: handlers.onHelp,
      category: 'global',
    })
  }

  // Escape is always available
  shortcuts.push({
    key: 'Escape',
    description: 'Close dialogs and modals',
    handler: () => {
      // This will be handled by individual dialogs
    },
    category: 'global',
  })

  return shortcuts
}
