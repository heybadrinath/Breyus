import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, Building2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardStats } from '../hooks/useDashboardStats'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { Sparkline, generateMockSparklineData } from '@/components/shared/Sparkline'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useMemo } from 'react'

interface StatsCardsProps {
  stats: DashboardStats | undefined
  isLoading: boolean
}

const cardConfigs = [
  {
    key: 'totalUsers',
    title: 'Total Users',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'activeTrades',
    title: 'Active Trades',
    icon: FileText,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    key: 'companies',
    title: 'Companies',
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'volume',
    title: 'Monthly Volume',
    icon: TrendingUp,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  // Generate stable mock sparkline data per card
  const sparklineData = useMemo(() => ({
    totalUsers: generateMockSparklineData(7, stats?.totalUsers ?? 100, 0.15),
    activeTrades: generateMockSparklineData(7, stats?.activeTrades ?? 50, 0.2),
    companies: generateMockSparklineData(7, stats?.totalCompanies ?? 30, 0.1),
    volume: generateMockSparklineData(7, stats?.monthlyVolume ?? 50000, 0.25),
  }), [stats?.totalUsers, stats?.activeTrades, stats?.totalCompanies, stats?.monthlyVolume])

  const cards = [
    {
      ...cardConfigs[0],
      value: stats?.totalUsers ?? 0,
      change: stats?.totalUsersChange ?? 0,
      sparkline: sparklineData.totalUsers,
    },
    {
      ...cardConfigs[1],
      value: stats?.activeTrades ?? 0,
      change: stats?.activeTradesChange ?? 0,
      sparkline: sparklineData.activeTrades,
    },
    {
      ...cardConfigs[2],
      value: stats?.totalCompanies ?? 0,
      change: stats?.totalCompaniesChange ?? 0,
      sparkline: sparklineData.companies,
    },
    {
      ...cardConfigs[3],
      value: stats?.monthlyVolume ?? 0,
      change: stats?.monthlyVolumeChange ?? 0,
      sparkline: sparklineData.volume,
      prefix: '$',
      formatValue: (v: number) => {
        if (v >= 1000000) return (v / 1000000).toFixed(1)
        if (v >= 1000) return (v / 1000).toFixed(1)
        return v.toString()
      },
      suffix: (v: number) => {
        if (v >= 1000000) return 'M'
        if (v >= 1000) return 'K'
        return ''
      },
    },
  ]

  // Show skeleton cards while loading
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} hover>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>

                <div className="text-3xl font-bold text-foreground tracking-tight">
                  {'prefix' in card && card.prefix}
                  <AnimatedNumber
                    value={'formatValue' in card ? parseFloat(card.formatValue(card.value)) : card.value}
                    duration={800}
                  />
                  {'suffix' in card && typeof card.suffix === 'function' && card.suffix(card.value)}
                </div>

                {/* Change indicator with sparkline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {card.change !== 0 ? (
                      <>
                        {card.change > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            card.change > 0 ? 'text-emerald-500' : 'text-red-500'
                          )}
                        >
                          {Math.abs(card.change)}%
                        </span>
                      </>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      vs last month
                    </span>
                  </div>

                  {/* Sparkline trend chart */}
                  <Sparkline
                    data={card.sparkline}
                    width={60}
                    height={20}
                  />
                </div>
              </div>

              {/* Icon */}
              <div className={cn(
                'p-3 rounded-xl',
                card.bgColor
              )}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
