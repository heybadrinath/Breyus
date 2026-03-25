import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Search,
  Home,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  BarChart3,
  Settings,
  Activity,
  Bell,
  Lock,
  Package,
  AlertTriangle,
  Layers,
  ArrowRight,
  Command,
  PenTool,
  MessageSquare,
  Mail,
  UserPlus,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  keywords?: string[]
  category: 'pages' | 'actions' | 'recent'
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * CommandPalette - Global search spotlight (Cmd+K)
 *
 * Provides quick navigation to any page and search functionality.
 * Uses fuzzy matching for better search results.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Define all navigable pages
  const pageItems: CommandItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview and statistics',
      icon: Home,
      action: () => navigate('/'),
      keywords: ['home', 'overview', 'stats'],
      category: 'pages',
    },
    {
      id: 'users',
      label: 'Users',
      description: 'User management',
      icon: Users,
      action: () => navigate('/users'),
      keywords: ['accounts', 'members', 'people'],
      category: 'pages',
    },
    {
      id: 'companies',
      label: 'Companies',
      description: 'Company profiles',
      icon: Building2,
      action: () => navigate('/companies'),
      keywords: ['organizations', 'business', 'firms'],
      category: 'pages',
    },
    {
      id: 'kyc',
      label: 'KYC Queue',
      description: 'Document verification',
      icon: ShieldCheck,
      action: () => navigate('/kyc'),
      keywords: ['verification', 'documents', 'compliance'],
      category: 'pages',
    },
    {
      id: 'trades',
      label: 'Trades',
      description: 'Trade management',
      icon: FileText,
      action: () => navigate('/trades'),
      keywords: ['transactions', 'orders', 'deals'],
      category: 'pages',
    },
    {
      id: 'disputes',
      label: 'Disputes',
      description: 'Dispute resolution',
      icon: AlertTriangle,
      action: () => navigate('/disputes'),
      keywords: ['conflicts', 'issues', 'problems'],
      category: 'pages',
    },
    {
      id: 'products',
      label: 'Products',
      description: 'Product catalog',
      icon: Package,
      action: () => navigate('/products'),
      keywords: ['items', 'goods', 'commodities'],
      category: 'pages',
    },
    {
      id: 'content',
      label: 'Content',
      description: 'Content management',
      icon: Layers,
      action: () => navigate('/content'),
      keywords: ['currencies', 'countries', 'ports', 'hsn'],
      category: 'pages',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Reports and insights',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      keywords: ['reports', 'charts', 'metrics'],
      category: 'pages',
    },
    {
      id: 'system',
      label: 'System Health',
      description: 'System monitoring',
      icon: Activity,
      action: () => navigate('/system'),
      keywords: ['health', 'status', 'monitoring'],
      category: 'pages',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      description: 'Alert rules and history',
      icon: Bell,
      action: () => navigate('/alerts'),
      keywords: ['notifications', 'rules', 'warnings'],
      category: 'pages',
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Security settings',
      icon: Lock,
      action: () => navigate('/security'),
      keywords: ['blocked', 'ips', 'logins'],
      category: 'pages',
    },
    {
      id: 'activity',
      label: 'Activity Log',
      description: 'Audit trail',
      icon: Activity,
      action: () => navigate('/activity'),
      keywords: ['logs', 'audit', 'history'],
      category: 'pages',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Application settings',
      icon: Settings,
      action: () => navigate('/settings'),
      keywords: ['preferences', 'config', 'options'],
      category: 'pages',
    },
    // Blog feature pages
    {
      id: 'blog-posts',
      label: 'Blog Posts',
      description: 'Manage blog content',
      icon: BookOpen,
      action: () => navigate('/blog'),
      keywords: ['blog', 'articles', 'posts', 'content', 'writing'],
      category: 'pages',
    },
    {
      id: 'blog-new',
      label: 'New Blog Post',
      description: 'Create a new article',
      icon: PenTool,
      action: () => navigate('/blog/new'),
      keywords: ['blog', 'write', 'create', 'new', 'article', 'draft'],
      category: 'pages',
    },
    {
      id: 'blog-users',
      label: 'Blog Users',
      description: 'Blog portal user management',
      icon: Users,
      action: () => navigate('/blog/users'),
      keywords: ['blog', 'readers', 'members', 'accounts'],
      category: 'pages',
    },
    {
      id: 'blog-writers',
      label: 'Blog Writers',
      description: 'Writer management',
      icon: PenTool,
      action: () => navigate('/blog/writers'),
      keywords: ['blog', 'writers', 'authors', 'contributors'],
      category: 'pages',
    },
    {
      id: 'blog-invites',
      label: 'Blog Invites',
      description: 'Writer invitations',
      icon: UserPlus,
      action: () => navigate('/blog/invites'),
      keywords: ['blog', 'invite', 'onboard', 'writer'],
      category: 'pages',
    },
    {
      id: 'blog-comments',
      label: 'Blog Comments',
      description: 'Comment moderation',
      icon: MessageSquare,
      action: () => navigate('/blog/comments'),
      keywords: ['blog', 'comments', 'moderation', 'replies'],
      category: 'pages',
    },
    {
      id: 'blog-analytics',
      label: 'Blog Analytics',
      description: 'Blog performance metrics',
      icon: BarChart3,
      action: () => navigate('/blog/analytics'),
      keywords: ['blog', 'analytics', 'stats', 'metrics', 'performance'],
      category: 'pages',
    },
    {
      id: 'blog-subscribers',
      label: 'Blog Subscribers',
      description: 'Newsletter subscribers',
      icon: Mail,
      action: () => navigate('/blog/subscribers'),
      keywords: ['blog', 'newsletter', 'subscribers', 'email', 'digest'],
      category: 'pages',
    },
  ], [navigate])

  // Simple fuzzy search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return pageItems

    const query = search.toLowerCase()
    return pageItems.filter(item => {
      const labelMatch = item.label.toLowerCase().includes(query)
      const descMatch = item.description?.toLowerCase().includes(query)
      const keywordMatch = item.keywords?.some(k => k.includes(query))
      return labelMatch || descMatch || keywordMatch
    })
  }, [search, pageItems])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action()
          onOpenChange(false)
        }
        break
    }
  }, [filteredItems, selectedIndex, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[550px]">
        {/* Search input */}
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="h-12 flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found for "{search}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Pages
              </div>
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action()
                    onOpenChange(false)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    index === selectedIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <ArrowRight className={cn(
                    'h-4 w-4 transition-opacity',
                    index === selectedIndex ? 'opacity-100' : 'opacity-0'
                  )} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
