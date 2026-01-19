import { useState } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useActivityLogs, useExportActivityLogs } from '../hooks/useActivityLogs'
import type { ActivityLog, ActivityLogsQueryParams } from '../types'
import { ACTION_CATEGORIES, TARGET_TYPES } from '../types'

// Helper to format date for display
function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

// Helper to get badge variant based on action category
function getCategoryBadgeVariant(category: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (category) {
    case 'auth':
      return 'outline'
    case 'users':
      return 'default'
    case 'trades':
      return 'secondary'
    case 'system':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function ActivityPage() {
  const { toast } = useToast()

  // Query params state
  const [params, setParams] = useState<ActivityLogsQueryParams>({
    page: 1,
    limit: 20,
  })
  const [searchInput, setSearchInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean
    log: ActivityLog | null
  }>({ open: false, log: null })

  // Queries and mutations
  const { data, isLoading, error, refetch } = useActivityLogs(params)
  const exportMutation = useExportActivityLogs()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleCategoryFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      actionCategory: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleTargetTypeFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      targetType: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleDateFilter = () => {
    setParams((prev) => ({
      ...prev,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
    }))
  }

  const handleClearFilters = () => {
    setParams({ page: 1, limit: 20 })
    setSearchInput('')
    setStartDate('')
    setEndDate('')
  }

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        adminId: params.adminId,
        actionCategory: params.actionCategory,
        action: params.action,
        targetType: params.targetType,
        startDate: params.startDate,
        endDate: params.endDate,
      })
      toast({
        title: 'Export complete',
        description: 'Activity logs have been downloaded as CSV.',
      })
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err?.message || 'Failed to export activity logs',
        variant: 'destructive',
      })
    }
  }

  const hasActiveFilters =
    params.actionCategory ||
    params.targetType ||
    params.startDate ||
    params.endDate ||
    params.search

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all admin actions and system events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, action, or admin..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Category Filter */}
            <Select
              value={params.actionCategory || 'all'}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ACTION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Target Type Filter */}
            <Select
              value={params.targetType || 'all'}
              onValueChange={handleTargetTypeFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {TARGET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-[150px]"
                  placeholder="Start Date"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
                placeholder="End Date"
              />
              <Button variant="outline" onClick={handleDateFilter}>
                Apply
              </Button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load activity logs
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Admin
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Target
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((log) => (
                      <tr key={log._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-3 px-4 text-sm">{log.adminEmail}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.action}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getCategoryBadgeVariant(log.actionCategory)}>
                            {log.actionCategory}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {log.targetType && (
                            <span className="text-muted-foreground">
                              {log.targetType}:{' '}
                            </span>
                          )}
                          <span className="font-medium">
                            {log.targetIdentifier || log.targetId || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm max-w-[300px] truncate">
                          {log.description}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailDialog({ open: true, log })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {data?.data.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No activity logs found
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
                    Showing {(data.page - 1) * (params.limit || 20) + 1} to{' '}
                    {Math.min(data.page * (params.limit || 20), data.total)} of{' '}
                    {data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! - 1 }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! + 1 }))
                      }
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

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => !open && setDetailDialog({ open: false, log: null })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
          </DialogHeader>
          {detailDialog.log && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="mt-1">{formatDate(detailDialog.log.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Admin
                  </label>
                  <p className="mt-1">{detailDialog.log.adminEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <p className="mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {detailDialog.log.action}
                    </code>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p className="mt-1">
                    <Badge
                      variant={getCategoryBadgeVariant(
                        detailDialog.log.actionCategory
                      )}
                    >
                      {detailDialog.log.actionCategory}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">{detailDialog.log.description}</p>
              </div>

              {/* Target Info */}
              {(detailDialog.log.targetType || detailDialog.log.targetIdentifier) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Target Type
                    </label>
                    <p className="mt-1">{detailDialog.log.targetType || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Target Identifier
                    </label>
                    <p className="mt-1">
                      {detailDialog.log.targetIdentifier ||
                        detailDialog.log.targetId ||
                        '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Previous Value */}
              {detailDialog.log.previousValue &&
                Object.keys(detailDialog.log.previousValue).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Previous Value
                    </label>
                    <pre className="mt-1 bg-muted p-3 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(detailDialog.log.previousValue, null, 2)}
                    </pre>
                  </div>
                )}

              {/* New Value */}
              {detailDialog.log.newValue &&
                Object.keys(detailDialog.log.newValue).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      New Value
                    </label>
                    <pre className="mt-1 bg-muted p-3 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(detailDialog.log.newValue, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Metadata */}
              {detailDialog.log.metadata &&
                Object.keys(detailDialog.log.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Metadata
                    </label>
                    <div className="mt-1 bg-muted p-3 rounded-md text-sm">
                      {detailDialog.log.metadata.ipAddress && (
                        <p>
                          <span className="text-muted-foreground">IP Address:</span>{' '}
                          {detailDialog.log.metadata.ipAddress}
                        </p>
                      )}
                      {detailDialog.log.metadata.userAgent && (
                        <p className="mt-1">
                          <span className="text-muted-foreground">User Agent:</span>{' '}
                          <span className="break-all">
                            {detailDialog.log.metadata.userAgent}
                          </span>
                        </p>
                      )}
                      {detailDialog.log.metadata.duration !== undefined && (
                        <p className="mt-1">
                          <span className="text-muted-foreground">Duration:</span>{' '}
                          {detailDialog.log.metadata.duration}ms
                        </p>
                      )}
                      {detailDialog.log.metadata.notes && (
                        <p className="mt-1">
                          <span className="text-muted-foreground">Notes:</span>{' '}
                          {detailDialog.log.metadata.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
