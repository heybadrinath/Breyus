import { Search, Sun, Moon, User, Command, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface HeaderProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { admin } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search - clickable to open command palette */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-4 flex-1 max-w-md"
      >
        <div className="relative w-full">
          <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-muted transition-colors">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <span className="text-muted-foreground flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (⌘⇧L)`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">
              {admin?.name || 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground">
              {admin?.email || 'admin@breyus.com'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
