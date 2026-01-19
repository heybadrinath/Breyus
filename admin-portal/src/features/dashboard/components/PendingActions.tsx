import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldCheck, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { PendingActions as PendingActionsType } from '../hooks/useDashboardStats'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface PendingActionsProps {
  data: PendingActionsType | undefined
  isLoading: boolean
}

export function PendingActions({ data, isLoading }: PendingActionsProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    {
      id: 'kyc',
      label: 'KYC Pending',
      icon: ShieldCheck,
      count: data?.kyc.count ?? 0,
      items: data?.kyc.items ?? [],
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: AlertTriangle,
      count: data?.disputes.count ?? 0,
      items: data?.disputes.items ?? [],
    },
    {
      id: 'stalled',
      label: 'Stalled Trades',
      icon: Clock,
      count: data?.stalledTrades.count ?? 0,
      items: data?.stalledTrades.items ?? [],
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="kyc">
          <TabsList className="grid w-full grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="relative">
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 px-1.5 text-[10px]"
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="kyc" className="mt-4">
            {data?.kyc.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending KYC verifications
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.kyc.items.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate('/kyc')}
                  >
                    <div>
                      <p className="font-medium">{item.companyName}</p>
                      <p className="text-sm text-muted-foreground">{item.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="mt-4">
            {data?.disputes.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active disputes
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.disputes.items.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/disputes/${item._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.raisedByEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.priority === 'urgent' ? 'destructive' :
                            item.priority === 'high' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.reason.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="stalled" className="mt-4">
            {data?.stalledTrades.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No stalled trades
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.stalledTrades.items.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/trades/${item._id}`)}
                  >
                    <div>
                      <p className="font-medium">{item.tradeId}</p>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
