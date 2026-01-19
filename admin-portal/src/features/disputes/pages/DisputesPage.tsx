import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  MoreHorizontal,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import { useDisputes, useDisputeStats, useSelfAssignDispute } from '../hooks/useDisputes'
import type { Dispute, DisputesQueryParams, DisputePriority, DisputeStatus } from '../types'

// Helper functions for dark mode compatible colors
function getPriorityColorClass(priority: DisputePriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    case 'high':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'medium':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'low':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusColorClass(status: DisputeStatus): string {
  switch (status) {
    case 'open':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    case 'under_review':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'resolved':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    case 'closed':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusIcon(status: DisputeStatus) {
  switch (status) {
    case 'open':
      return <AlertCircle className="w-3 h-3 mr-1" />
    case 'under_review':
      return <Clock className="w-3 h-3 mr-1" />
    case 'resolved':
      return <CheckCircle className="w-3 h-3 mr-1" />
    case 'closed':
      return <XCircle className="w-3 h-3 mr-1" />
  }
}

function formatReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    payment_issue: 'Payment Issue',
    quality_issue: 'Quality Issue',
    delivery_delay: 'Delivery Delay',
    documentation_problem: 'Documentation Problem',
    communication_issue: 'Communication Issue',
    pricing_dispute: 'Pricing Dispute',
    contract_breach: 'Contract Breach',
    other: 'Other',
  }
  return reasonMap[reason] || reason
}

export function DisputesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Query params state
  const [params, setParams] = useState<DisputesQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  // Queries and mutations
  const { data, isLoading, error } = useDisputes(params)
  const { data: stats, isLoading: statsLoading } = useDisputeStats()
  const selfAssignMutation = useSelfAssignDispute()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.total ?? 50, 0.1),
    open: generateMockSparklineData(7, stats?.open ?? 10, 0.2),
    resolved: generateMockSparklineData(7, stats?.resolved ?? 30, 0.12),
    underReview: generateMockSparklineData(7, stats?.underReview ?? 8, 0.15),
  }), [stats])

  const handleSearch = () => {
    setParams(prev => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      status: value === 'all' ? undefined : (value as DisputeStatus),
      page: 1,
    }))
  }

  const handlePriorityFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      priority: value === 'all' ? undefined : (value as DisputePriority),
      page: 1,
    }))
  }

  const handleUnassignedFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      unassigned: value === 'all' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const handleSelfAssign = async (disputeId: string) => {
    try {
      await selfAssignMutation.mutateAsync({ disputeId })
      toast({ title: 'Dispute assigned', description: 'The dispute has been assigned to you.' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to assign dispute',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Disputes</h1>
        <p className="text-muted-foreground">Manage and resolve trade disputes</p>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Disputes"
          subtitle="All reported issues"
          value={stats?.total ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Open"
          subtitle={`${stats?.unassigned ?? 0} unassigned`}
          value={stats?.open ?? 0}
          icon={AlertCircle}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={sparklineData.open}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Resolved"
          subtitle="Successfully handled"
          value={stats?.resolved ?? 0}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.resolved}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Under Review"
          subtitle="Being investigated"
          value={stats?.underReview ?? 0}
          icon={Clock}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.underReview}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Status Filter */}
            <Select value={params.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={params.priority || 'all'} onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignment Filter */}
            <Select value={params.unassigned === undefined ? 'all' : String(params.unassigned)} onValueChange={handleUnassignedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Unassigned</SelectItem>
                <SelectItem value="false">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load disputes
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Raised By</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned To</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.disputes.map((dispute: Dispute) => (
                      <tr
                        key={dispute._id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/disputes/${dispute._id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{dispute.raisedByEmail}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {dispute.raisedByRole}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[200px]">
                            <div className="font-medium">{formatReasonText(dispute.reason)}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {dispute.description.substring(0, 50)}...
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getPriorityColorClass(dispute.priority)}>
                            {dispute.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getStatusColorClass(dispute.status)}>
                            {getStatusIcon(dispute.status)}
                            {dispute.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {dispute.assignedAdmin ? (
                            <div className="text-sm">{dispute.assignedAdmin.email}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/disputes/${dispute._id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {!dispute.assignedAdmin && (
                                <DropdownMenuItem onClick={() => handleSelfAssign(dispute._id)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign to Me
                                </DropdownMenuItem>
                              )}
                              {dispute.trade?._id && (
                                <DropdownMenuItem onClick={() => navigate(`/trades/${dispute.trade._id}`)}>
                                  View Trade
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {data?.disputes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No disputes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
