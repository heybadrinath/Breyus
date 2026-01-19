import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  _id: string
  adminEmail: string
  action: string
  actionCategory: string
  description: string
  timestamp: string
  targetType?: string
}

interface ActivityResponse {
  statusCode: number
  message: string
  data: {
    data: ActivityItem[]
    total: number
    page: number
    totalPages: number
  }
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const { data } = await api.get<ActivityResponse>('/admin/dashboard/activity?limit=10')
      return data.data.data
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  useEffect(() => {
    if (data) {
      setActivities(data)
    }
  }, [data])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-500/10 text-blue-500',
      users: 'bg-green-500/10 text-green-500',
      trades: 'bg-purple-500/10 text-purple-500',
      system: 'bg-orange-500/10 text-orange-500',
      companies: 'bg-cyan-500/10 text-cyan-500',
    }
    return colors[category.toLowerCase()] || 'bg-gray-500/10 text-gray-500'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li
                key={activity._id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {activity.adminEmail}
                    </span>
                    <Badge
                      variant="secondary"
                      className={getCategoryColor(activity.actionCategory)}
                    >
                      {activity.actionCategory}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
