import { useNavigate } from 'react-router-dom'
import {
  Coins,
  Globe,
  Ship,
  FolderTree,
  FileCode,
  FileText,
  Ruler,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useContentStats } from '../hooks/useContentStats'

interface StatCardProps {
  title: string
  icon: typeof Coins
  total: number
  subtitle?: string
  path: string
  color: string
  details?: React.ReactNode
}

function StatCard({ title, icon: Icon, total, subtitle, path, color, details }: StatCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => navigate(path)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{total.toLocaleString()}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {details && <div className="mt-2">{details}</div>}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Manage</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ContentOverview() {
  const { data: stats, isLoading, error } = useContentStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Failed to load content statistics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6">
        <h2 className="text-xl font-semibold">Content Overview</h2>
        <p className="text-muted-foreground mt-1">
          Manage all database-driven content types used throughout the platform.
          Click on any card to view and edit that content type.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Currencies"
          icon={Coins}
          total={stats?.currencies.total || 0}
          subtitle={`${stats?.currencies.active || 0} active`}
          path="/content/currencies"
          color="bg-yellow-100 text-yellow-700"
        />

        <StatCard
          title="Countries"
          icon={Globe}
          total={stats?.countries.total || 0}
          subtitle={`${stats?.countries.active || 0} active`}
          path="/content/countries"
          color="bg-blue-100 text-blue-700"
        />

        <StatCard
          title="Ports"
          icon={Ship}
          total={stats?.ports.total || 0}
          subtitle="Sea, air, and land ports"
          path="/content/ports"
          color="bg-cyan-100 text-cyan-700"
        />

        <StatCard
          title="Categories"
          icon={FolderTree}
          total={stats?.categories.total || 0}
          subtitle="Product classification hierarchy"
          path="/content/categories"
          color="bg-purple-100 text-purple-700"
          details={
            stats?.commodities && (stats.commodities.mainstream > 0 || stats.commodities.niche > 0) && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {stats.commodities.mainstream} mainstream
                </span>
                <span className="flex items-center gap-1 text-orange-600">
                  <TrendingDown className="h-3 w-3" />
                  {stats.commodities.niche} niche
                </span>
              </div>
            )
          }
        />

        <StatCard
          title="HSN Codes"
          icon={FileCode}
          total={stats?.hsnCodes.total || 0}
          subtitle="Harmonized System codes"
          path="/content/hsn-codes"
          color="bg-orange-100 text-orange-700"
        />

        <StatCard
          title="Incoterms"
          icon={FileText}
          total={stats?.incoterms.total || 0}
          subtitle="International trade terms"
          path="/content/incoterms"
          color="bg-gray-100 text-gray-700"
        />

        <StatCard
          title="Units"
          icon={Ruler}
          total={stats?.units.total || 0}
          subtitle={`${stats?.units.active || 0} active`}
          path="/content/units"
          color="bg-pink-100 text-pink-700"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common content management tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/content/categories'}>
            <FolderTree className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/content/units'}>
            <Ruler className="h-4 w-4 mr-2" />
            Manage Units
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/content/hsn-codes'}>
            <FileCode className="h-4 w-4 mr-2" />
            HSN Code Search
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
