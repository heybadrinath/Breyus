import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { ShortcutsHelpModal } from '@/components/shared/ShortcutsHelpModal'
import { useKeyboardShortcuts, createGlobalShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'admin-sidebar-collapsed'

export function AdminLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY)
    return stored === 'true'
  })

  // Mobile sidebar state
  const [mobileOpen, setMobileOpen] = useState(false)

  // Command palette state
  const [commandOpen, setCommandOpen] = useState(false)

  // Shortcuts help modal state
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
  }, [collapsed])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleCollapse = () => setCollapsed((prev) => !prev)
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), [])

  // Global keyboard shortcuts
  const shortcuts = createGlobalShortcuts({
    onSearch: () => setCommandOpen(true),
    onHelp: () => setShortcutsOpen(true),
  })

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'transition-all duration-200',
          'md:ml-[72px]', // Default on mobile (collapsed)
          !collapsed && 'md:ml-[280px]'
        )}
      >
        <Header
          onMenuClick={toggleMobile}
          onSearchClick={() => setCommandOpen(true)}
        />

        <main className="p-4 md:p-6">
          {/* Breadcrumb navigation */}
          <Breadcrumb />

          {/* Key-based remount triggers animation on route change */}
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  )
}
