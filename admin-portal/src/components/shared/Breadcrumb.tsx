import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home, Users, Building2, FileText, ShieldCheck, BarChart3, Settings, Activity, Bell, Lock, Package, AlertTriangle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

// Route configuration with labels and icons
const routeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  '': { label: 'Dashboard', icon: Home },
  'users': { label: 'Users', icon: Users },
  'companies': { label: 'Companies', icon: Building2 },
  'kyc': { label: 'KYC Queue', icon: ShieldCheck },
  'trades': { label: 'Trades', icon: FileText },
  'disputes': { label: 'Disputes', icon: AlertTriangle },
  'products': { label: 'Products', icon: Package },
  'content': { label: 'Content', icon: Layers },
  'currencies': { label: 'Currencies', icon: Layers },
  'countries': { label: 'Countries', icon: Layers },
  'ports': { label: 'Ports', icon: Layers },
  'categories': { label: 'Categories', icon: Layers },
  'hsn-codes': { label: 'HSN Codes', icon: Layers },
  'incoterms': { label: 'Incoterms', icon: Layers },
  'system': { label: 'System Health', icon: Activity },
  'analytics': { label: 'Analytics', icon: BarChart3 },
  'alerts': { label: 'Alerts', icon: Bell },
  'security': { label: 'Security', icon: Lock },
  'activity': { label: 'Activity Log', icon: Activity },
  'settings': { label: 'Settings', icon: Settings },
}

interface BreadcrumbItem {
  label: string
  path: string
  icon: React.ElementType
  isLast: boolean
}

/**
 * Breadcrumb - Shows the current location path for better navigation context
 *
 * Parses the current URL path and generates breadcrumb items with
 * appropriate icons and links.
 */
export function Breadcrumb() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  // Generate breadcrumb items from path
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Dashboard/Home
  breadcrumbs.push({
    label: 'Dashboard',
    path: '/',
    icon: Home,
    isLast: pathSegments.length === 0,
  })

  // Build up path segments
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Check if this is a dynamic segment (like user ID or trade ID)
    const isId = /^[a-f0-9]{24}$/.test(segment) || /^\d+$/.test(segment)

    if (isId) {
      // For IDs, show "Details" or keep the parent context
      breadcrumbs.push({
        label: 'Details',
        path: currentPath,
        icon: routeConfig[pathSegments[index - 1]]?.icon || FileText,
        isLast: index === pathSegments.length - 1,
      })
    } else {
      const config = routeConfig[segment]
      if (config) {
        breadcrumbs.push({
          label: config.label,
          path: currentPath,
          icon: config.icon,
          isLast: index === pathSegments.length - 1,
        })
      }
    }
  })

  // Don't show breadcrumb if only on dashboard
  if (breadcrumbs.length === 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          )}

          {item.isLast ? (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-1.5 hover:text-foreground transition-colors",
                index === 0 && "text-primary hover:text-primary/80"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
