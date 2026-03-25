import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Users2,
  Building2,
  FileText,
  AlertTriangle,
  FileCheck,
  Package,
  Activity,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  Leaf,
  Bell,
  Shield,
  X,
  BookOpen,
  PenTool,
  Mail,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Building2, label: 'Companies', path: '/companies' },
  { icon: FileText, label: 'Trades', path: '/trades' },
  { icon: AlertTriangle, label: 'Disputes', path: '/disputes' },
  { icon: FileCheck, label: 'KYC Documents', path: '/kyc' },
  { icon: Package, label: 'Products', path: '/products' },
]

const systemNavItems = [
  { icon: Activity, label: 'System Health', path: '/system' },
  { icon: Shield, label: 'Security', path: '/security' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: ScrollText, label: 'Activity Log', path: '/activity' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
]

const blogNavItems = [
  { icon: BookOpen, label: 'Posts', path: '/blog' },
  { icon: Users2, label: 'Users', path: '/blog/users' },
  { icon: PenTool, label: 'Writers', path: '/blog/writers' },
  { icon: Mail, label: 'Invites', path: '/blog/invites' },
  { icon: MessageCircle, label: 'Comments', path: '/blog/comments' },
  { icon: TrendingUp, label: 'Analytics', path: '/blog/analytics' },
  { icon: Mail, label: 'Subscribers', path: '/blog/subscribers' },
]

const settingsNavItems = [
  { icon: Settings, label: 'Content', path: '/content' },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // On mobile, always show full sidebar when open
  const isExpanded = mobileOpen || !collapsed

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
        // Mobile: hidden by default, slide in when open
        'max-md:-translate-x-full max-md:w-64',
        mobileOpen && 'max-md:translate-x-0',
        // Desktop: respect collapsed state
        'md:translate-x-0',
        collapsed ? 'md:w-[72px]' : 'md:w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Leaf className="w-5 h-5" />
          </div>
          {isExpanded && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Breyus</span>
              <span className="text-xs text-muted-foreground">Admin Portal</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {/* Main Section */}
        <div className="mb-6">
          {isExpanded && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </span>
          )}
          <ul className="mt-2 space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* System Section */}
        <div className="mb-6">
          {isExpanded && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              System
            </span>
          )}
          <ul className="mt-2 space-y-1">
            {systemNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Blog Section */}
        <div className="mb-6">
          {isExpanded && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Blog
            </span>
          )}
          <ul className="mt-2 space-y-1">
            {blogNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/blog'}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Section */}
        <div className="mb-6">
          {isExpanded && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Settings
            </span>
          )}
          <ul className="mt-2 space-y-1">
            {settingsNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isExpanded && <span>Logout</span>}
        </button>

        {/* Collapse toggle - hidden on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-full justify-center hidden md:flex"
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>
    </aside>
  )
}
