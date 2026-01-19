import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Coins,
  Globe,
  Ship,
  FolderTree,
  FileCode,
  FileText,
  Ruler,
  LayoutDashboard,
} from 'lucide-react'
import { ContentOverview } from '../components/ContentOverview'

const contentNavItems = [
  {
    label: 'Overview',
    path: '/content',
    icon: LayoutDashboard,
    description: 'Content management dashboard',
    exact: true,
  },
  {
    label: 'Currencies',
    path: '/content/currencies',
    icon: Coins,
    description: 'Manage currency codes and symbols',
  },
  {
    label: 'Countries',
    path: '/content/countries',
    icon: Globe,
    description: 'Manage country list',
  },
  {
    label: 'Ports',
    path: '/content/ports',
    icon: Ship,
    description: 'Manage sea, air, and land ports',
  },
  {
    label: 'Categories',
    path: '/content/categories',
    icon: FolderTree,
    description: 'Product category hierarchy',
  },
  {
    label: 'HSN Codes',
    path: '/content/hsn-codes',
    icon: FileCode,
    description: 'Harmonized System codes',
  },
  {
    label: 'Incoterms',
    path: '/content/incoterms',
    icon: FileText,
    description: 'Trade terms and cost allocation',
  },
  // Note: Commodities tab removed - commodity classification is now merged into Categories
  {
    label: 'Units',
    path: '/content/units',
    icon: Ruler,
    description: 'Units of measurement',
  },
]

export function ContentPage() {
  const location = useLocation()
  const isOverviewPage = location.pathname === '/content'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage database-driven content types used throughout the platform
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="border-b">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {contentNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      {isOverviewPage ? <ContentOverview /> : <Outlet />}
    </div>
  )
}
