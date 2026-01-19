import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Activity,
  Database,
  Server,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  Container,
  Globe,
  Wifi,
  Shield,
  Download,
  FileText,
  Zap,
  Calendar as CalendarIcon,
  Plus,
  X,
  Clock,
  Info,
  ScrollText,
  Search,
  Copy,
  Play,
  Square,
  RotateCcw,
  Eye,
  Network,
  FolderOpen,
  Settings2,
  Heart,
  Archive,
  Trash2,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSystemHealth,
  useContainerStatus,
  useDiskUsage,
  useMaintenance,
  useSSLCertificates,
  useQuickActions,
  useScheduleMaintenance,
  useCancelScheduledMaintenance,
  useEnhancedDatabaseStats,
  useContainerLogs,
  useContainerDetails,
  useContainerActions,
  useBackups,
  useBackupStorage,
  useBackupActions,
  HealthStatus,
  BackupTarget,
} from '../hooks/useSystemHealth'
import { useState, useEffect, useMemo, useRef } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

const statusColors: Record<HealthStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unhealthy: 'bg-red-500',
}

const statusIcons: Record<HealthStatus, React.ReactNode> = {
  healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  unhealthy: <XCircle className="h-5 w-5 text-red-500" />,
}

const serviceIcons: Record<string, React.ReactNode> = {
  api: <Server className="h-5 w-5" />,
  mongodb: <Database className="h-5 w-5" />,
  postgres: <Database className="h-5 w-5" />,
  redis: <Database className="h-5 w-5" />,
  aiService: <Cpu className="h-5 w-5" />,
  frontend: <Globe className="h-5 w-5" />,
  websocket: <Wifi className="h-5 w-5" />,
}

const serviceLabels: Record<string, string> = {
  api: 'API Server',
  mongodb: 'MongoDB',
  postgres: 'PostgreSQL',
  redis: 'Redis',
  aiService: 'AI Service',
  frontend: 'Frontend',
  websocket: 'WebSocket',
}

export function SystemHealthPage() {
  const { toast } = useToast()
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth()
  const { data: containers, isLoading: containersLoading, refetch: refetchContainers } = useContainerStatus()
  const { data: disks, isLoading: disksLoading } = useDiskUsage()
  const { data: maintenance, toggle, isToggling } = useMaintenance()
  const { data: sslCerts, isLoading: sslLoading } = useSSLCertificates()
  const { data: dbStats } = useEnhancedDatabaseStats()
  const { rotateLogs, runHealthCheck } = useQuickActions()
  const scheduleMutation = useScheduleMaintenance()
  const cancelScheduleMutation = useCancelScheduledMaintenance()
  const { restartContainer, stopContainer, startContainer } = useContainerActions()

  // Backup management
  const { data: backups, isLoading: backupsLoading, refetch: refetchBackups } = useBackups()
  const { data: backupStorage } = useBackupStorage()
  const { createBackup, deleteBackup } = useBackupActions()

  // Maintenance state
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | undefined>()
  const [bypassIPs, setBypassIPs] = useState<string[]>([])
  const [newIP, setNewIP] = useState('')
  const [scheduledStart, setScheduledStart] = useState<Date | undefined>()
  const [scheduledEnd, setScheduledEnd] = useState<Date | undefined>()
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  // Logs modal state
  const [selectedContainerForLogs, setSelectedContainerForLogs] = useState<string | null>(null)
  const [logLines, setLogLines] = useState(100)
  const [logSearch, setLogSearch] = useState('')
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')
  const [liveTailEnabled, setLiveTailEnabled] = useState(false)
  const liveTailIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Details modal state
  const [selectedContainerForDetails, setSelectedContainerForDetails] = useState<string | null>(null)

  // Action confirmation state
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'restart' | 'stop' | 'start'
    containerName: string
  } | null>(null)

  // Backup state
  const [backupTarget, setBackupTarget] = useState<BackupTarget>('all')
  const [deleteBackupConfirm, setDeleteBackupConfirm] = useState<{
    type: 'mongodb' | 'postgresql'
    filename: string
  } | null>(null)

  // Fetch logs and details
  const { data: containerLogs, isLoading: logsLoading, refetch: refetchLogs } = useContainerLogs(selectedContainerForLogs, logLines)
  const { data: containerDetails, isLoading: detailsLoading } = useContainerDetails(selectedContainerForDetails)

  // Sync state with maintenance config
  useEffect(() => {
    if (maintenance) {
      setMaintenanceMessage(maintenance.message || '')
      setBypassIPs(maintenance.allowedIPs || [])
      if (maintenance.estimatedEndTime) {
        setEstimatedEndTime(new Date(maintenance.estimatedEndTime))
      }
    }
  }, [maintenance])

  // Live tail effect
  useEffect(() => {
    if (liveTailEnabled && selectedContainerForLogs) {
      liveTailIntervalRef.current = setInterval(() => {
        refetchLogs()
      }, 2000)
    } else if (liveTailIntervalRef.current) {
      clearInterval(liveTailIntervalRef.current)
      liveTailIntervalRef.current = null
    }

    return () => {
      if (liveTailIntervalRef.current) {
        clearInterval(liveTailIntervalRef.current)
      }
    }
  }, [liveTailEnabled, selectedContainerForLogs, refetchLogs])

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    if (!containerLogs?.logs) return ''

    let lines = containerLogs.logs.split('\n')

    // Filter by log level
    if (logLevelFilter !== 'all') {
      lines = lines.filter(line => {
        const lowerLine = line.toLowerCase()
        if (logLevelFilter === 'error') return lowerLine.includes('error') || lowerLine.includes('err')
        if (logLevelFilter === 'warn') return lowerLine.includes('warn') || lowerLine.includes('warning')
        if (logLevelFilter === 'info') return lowerLine.includes('info')
        return true
      })
    }

    // Search filter
    if (logSearch) {
      const searchLower = logSearch.toLowerCase()
      lines = lines.filter(line => line.toLowerCase().includes(searchLower))
    }

    return lines.join('\n')
  }, [containerLogs?.logs, logLevelFilter, logSearch])

  const handleMaintenanceToggle = async () => {
    try {
      await toggle({
        isEnabled: !maintenance?.isEnabled,
        message: maintenanceMessage || 'System maintenance in progress',
        estimatedEndTime: estimatedEndTime?.toISOString(),
        allowedIPs: bypassIPs,
      })
      toast({
        title: maintenance?.isEnabled ? 'Maintenance mode disabled' : 'Maintenance mode enabled',
        variant: 'default',
      })
    } catch (error) {
      toast({
        title: 'Failed to toggle maintenance mode',
        variant: 'destructive',
      })
    }
  }

  const handleAddBypassIP = () => {
    if (newIP && !bypassIPs.includes(newIP)) {
      setBypassIPs([...bypassIPs, newIP])
      setNewIP('')
    }
  }

  const handleRemoveBypassIP = (ip: string) => {
    setBypassIPs(bypassIPs.filter(i => i !== ip))
  }

  const handleScheduleMaintenance = async () => {
    if (scheduledStart && scheduledEnd) {
      try {
        await scheduleMutation.mutateAsync({
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          message: maintenanceMessage,
          allowedIPs: bypassIPs,
        })
        setShowScheduleForm(false)
        setScheduledStart(undefined)
        setScheduledEnd(undefined)
        toast({ title: 'Maintenance window scheduled' })
      } catch (error) {
        toast({ title: 'Failed to schedule maintenance', variant: 'destructive' })
      }
    }
  }

  const handleQuickAction = async (action: 'backup' | 'logs' | 'health') => {
    try {
      if (action === 'backup') {
        await createBackup.mutateAsync(backupTarget)
        toast({ title: `Backup created successfully (${backupTarget})` })
        refetchBackups()
      } else if (action === 'logs') {
        await rotateLogs.mutateAsync()
        toast({ title: 'Logs rotated successfully' })
      } else {
        await runHealthCheck.mutateAsync()
        toast({ title: 'Health check completed' })
        refetchHealth()
      }
    } catch (error) {
      toast({
        title: `Failed to ${action === 'backup' ? 'create backup' : action === 'logs' ? 'rotate logs' : 'run health check'}`,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteBackupConfirm) return
    try {
      await deleteBackup.mutateAsync(deleteBackupConfirm)
      toast({ title: 'Backup deleted successfully' })
      setDeleteBackupConfirm(null)
    } catch (error) {
      toast({ title: 'Failed to delete backup', variant: 'destructive' })
    }
  }

  const handleContainerAction = async () => {
    if (!actionConfirm) return

    try {
      if (actionConfirm.type === 'restart') {
        await restartContainer.mutateAsync(actionConfirm.containerName)
        toast({ title: `Container ${actionConfirm.containerName} restarted` })
      } else if (actionConfirm.type === 'stop') {
        await stopContainer.mutateAsync(actionConfirm.containerName)
        toast({ title: `Container ${actionConfirm.containerName} stopped` })
      } else if (actionConfirm.type === 'start') {
        await startContainer.mutateAsync(actionConfirm.containerName)
        toast({ title: `Container ${actionConfirm.containerName} started` })
      }
      refetchContainers()
    } catch (error) {
      toast({
        title: `Failed to ${actionConfirm.type} container`,
        variant: 'destructive',
      })
    } finally {
      setActionConfirm(null)
    }
  }

  const handleCopyLogs = () => {
    if (filteredLogs) {
      navigator.clipboard.writeText(filteredLogs)
      toast({ title: 'Logs copied to clipboard' })
    }
  }

  const handleDownloadLogs = () => {
    if (filteredLogs && selectedContainerForLogs) {
      const blob = new Blob([filteredLogs], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedContainerForLogs}-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Logs downloaded' })
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(0)} MB`
  }

  const getServiceExtraInfo = (key: string, service: any) => {
    const info: string[] = []

    if (service.latency !== undefined) {
      info.push(`${service.latency < 1 ? '< 1' : service.latency}ms latency`)
    }

    if (service.details?.activeConnections !== undefined) {
      info.push(`${service.details.activeConnections} connections`)
    }

    if (key === 'mongodb' && dbStats?.mongodb) {
      info.push(`${dbStats.mongodb.opsPerSec} ops/sec`)
    }

    if (key === 'redis' && dbStats?.redis) {
      info.push(dbStats.redis.usedMemory)
    }

    return info
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system status and manage maintenance mode
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={() => refetchHealth()} disabled={healthLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', healthLoading && 'animate-spin')} />
          {healthLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Perform common system maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Backup with target selection */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Backup Target</Label>
              <div className="flex gap-2">
                <select
                  value={backupTarget}
                  onChange={(e) => setBackupTarget(e.target.value as BackupTarget)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  disabled={createBackup.isPending}
                >
                  <option value="all">All Databases</option>
                  <option value="mongo">MongoDB Only</option>
                  <option value="postgres">PostgreSQL Only</option>
                </select>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleQuickAction('backup')}
                  disabled={createBackup.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {createBackup.isPending ? 'Creating...' : 'Create Backup'}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => handleQuickAction('logs')}
              disabled={rotateLogs.isPending}
              className="min-w-[160px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              {rotateLogs.isPending ? 'Rotating...' : 'Rotate Logs'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => handleQuickAction('health')}
              disabled={runHealthCheck.isPending}
              className="min-w-[160px]"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', runHealthCheck.isPending && 'animate-spin')} />
              {runHealthCheck.isPending ? 'Checking...' : 'Run Health Check'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Status & Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Service Status
              </CardTitle>
              {health && (
                <CardDescription className="mt-1">
                  Last checked: {formatDistanceToNow(new Date(health.lastChecked), { addSuffix: true })}
                </CardDescription>
              )}
            </div>
            {health && (
              <Badge
                variant="secondary"
                className={cn(
                  'px-4 py-2 text-sm',
                  health.overall === 'healthy' && 'bg-green-500/10 text-green-500 border-green-500/20',
                  health.overall === 'degraded' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                  health.overall === 'unhealthy' && 'bg-red-500/10 text-red-500 border-red-500/20'
                )}
              >
                {statusIcons[health.overall]}
                <span className="ml-2 capitalize font-medium">{health.overall}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : health ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(health.services).map(([key, service]) => (
                <div
                  key={key}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all",
                    service.status === 'healthy' && 'border-green-500/20 bg-green-500/5',
                    service.status === 'degraded' && 'border-yellow-500/20 bg-yellow-500/5',
                    service.status === 'unhealthy' && 'border-red-500/20 bg-red-500/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        service.status === 'healthy' && 'bg-green-500/10 text-green-500',
                        service.status === 'degraded' && 'bg-yellow-500/10 text-yellow-500',
                        service.status === 'unhealthy' && 'bg-red-500/10 text-red-500'
                      )}>
                        {serviceIcons[key]}
                      </div>
                      <span className="font-semibold">
                        {serviceLabels[key] || key}
                      </span>
                    </div>
                    <div className={cn('h-3 w-3 rounded-full', statusColors[service.status])} />
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{service.message}</p>

                  {getServiceExtraInfo(key, service).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getServiceExtraInfo(key, service).map((info, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                          {info}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Failed to load health data</p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Grid: System Resources & Maintenance Mode */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Resources */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Resources
              </CardTitle>
              <CardDescription>
                Server resource utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">CPU Usage</span>
                  <span className="text-muted-foreground font-mono">{health.system.cpuUsage}%</span>
                </div>
                <Progress
                  value={health.system.cpuUsage}
                  className={cn(
                    'h-3',
                    health.system.cpuUsage > 90 && '[&>div]:bg-red-500',
                    health.system.cpuUsage > 70 && health.system.cpuUsage <= 90 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Memory Usage</span>
                  <span className="text-muted-foreground font-mono">
                    {formatBytes(health.system.memoryUsage.used)} / {formatBytes(health.system.memoryUsage.total)}
                  </span>
                </div>
                <Progress
                  value={health.system.memoryUsage.percent}
                  className={cn(
                    'h-3',
                    health.system.memoryUsage.percent > 90 && '[&>div]:bg-red-500',
                    health.system.memoryUsage.percent > 70 && health.system.memoryUsage.percent <= 90 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono">{formatUptime(health.system.uptime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Load Average</span>
                  <span className="font-mono">{health.system.loadAverage.map(l => l.toFixed(2)).join(', ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Mode Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              Enable to block user access during updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Toggle Section */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="maintenance-toggle" className="font-medium">
                  Enable Maintenance Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Users will see a maintenance page
                </p>
              </div>
              <Switch
                id="maintenance-toggle"
                checked={maintenance?.isEnabled ?? false}
                onCheckedChange={handleMaintenanceToggle}
                disabled={isToggling}
              />
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Message for users</Label>
              <Input
                id="maintenance-message"
                placeholder="System maintenance in progress..."
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                disabled={isToggling}
              />
            </div>

            {/* Estimated End Time */}
            <div className="space-y-2">
              <Label htmlFor="estimated-end">Estimated End Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimated-end"
                  type="datetime-local"
                  value={estimatedEndTime ? format(estimatedEndTime, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setEstimatedEndTime(e.target.value ? new Date(e.target.value) : undefined)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Bypass IPs */}
            <div className="space-y-2">
              <Label>Bypass IPs (allowed during maintenance)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBypassIP()}
                />
                <Button variant="outline" size="icon" onClick={handleAddBypassIP}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {bypassIPs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {bypassIPs.map((ip) => (
                    <Badge key={ip} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {ip}
                      <button onClick={() => handleRemoveBypassIP(ip)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Maintenance */}
            <div className="border-t pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">Schedule Future Maintenance</span>
                </div>
                {maintenance?.scheduledStart ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelScheduleMutation.mutateAsync()}
                    disabled={cancelScheduleMutation.isPending}
                  >
                    Cancel Scheduled
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                  >
                    {showScheduleForm ? 'Cancel' : 'Schedule'}
                  </Button>
                )}
              </div>

              {maintenance?.scheduledStart && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Scheduled Maintenance Window</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    From: {format(new Date(maintenance.scheduledStart), 'PPP HH:mm')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To: {format(new Date(maintenance.scheduledEnd!), 'PPP HH:mm')}
                  </p>
                </div>
              )}

              {showScheduleForm && !maintenance?.scheduledStart && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-start">Start Time</Label>
                      <Input
                        id="scheduled-start"
                        type="datetime-local"
                        value={scheduledStart ? format(scheduledStart, "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setScheduledStart(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-end">End Time</Label>
                      <Input
                        id="scheduled-end"
                        type="datetime-local"
                        value={scheduledEnd ? format(scheduledEnd, "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setScheduledEnd(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleScheduleMaintenance}
                    disabled={!scheduledStart || !scheduledEnd || scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
                  </Button>
                </div>
              )}
            </div>

            {/* Active Maintenance Alert */}
            {maintenance?.isEnabled && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  Maintenance mode is currently active
                </p>
                {maintenance.estimatedEndTime && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimated end: {format(new Date(maintenance.estimatedEndTime), 'PPP HH:mm')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Users will see the maintenance message when accessing the platform
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SSL Certificates - Only show if there are certificates */}
      {!sslLoading && sslCerts && sslCerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SSL Certificates
                </CardTitle>
                <CardDescription>
                  Monitor certificate expiry status
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled>
                Renew All Certs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sslCerts.map((cert) => (
                <div key={cert.domain} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Shield className={cn(
                      'h-5 w-5',
                      cert.status === 'valid' && 'text-green-500',
                      cert.status === 'expiring_soon' && 'text-yellow-500',
                      cert.status === 'expired' && 'text-red-500'
                    )} />
                    <div>
                      <p className="font-medium">{cert.domain}</p>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className={cn(
                        cert.status === 'valid' && 'bg-green-500/10 text-green-500',
                        cert.status === 'expiring_soon' && 'bg-yellow-500/10 text-yellow-500',
                        cert.status === 'expired' && 'bg-red-500/10 text-red-500'
                      )}
                    >
                      {cert.daysRemaining > 0 ? `${cert.daysRemaining} days` : 'Expired'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(cert.expiryDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSL info banner when no certs configured */}
      {!sslLoading && (!sslCerts || sslCerts.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <Info className="h-5 w-5" />
              <p>No SSL certificates configured. Set the <code className="bg-muted px-2 py-1 rounded text-sm">SSL_DOMAINS</code> environment variable to enable SSL monitoring.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Docker Containers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5" />
            Docker Containers
          </CardTitle>
          <CardDescription>
            Container status, resource usage, and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {containersLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : containers && containers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Container</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Uptime</th>
                    <th className="text-left py-3 px-4 font-medium">Restarts</th>
                    <th className="text-left py-3 px-4 font-medium">CPU</th>
                    <th className="text-left py-3 px-4 font-medium">Memory</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container) => (
                    <tr key={container.name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{container.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{container.image}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            container.status === 'running' && 'bg-green-500/10 text-green-500',
                            container.status === 'stopped' && 'bg-red-500/10 text-red-500',
                            container.status === 'restarting' && 'bg-yellow-500/10 text-yellow-500'
                          )}
                        >
                          {container.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{container.uptime}</td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            container.restarts > 5 && 'bg-red-500/10 text-red-500',
                            container.restarts > 0 && container.restarts <= 5 && 'bg-yellow-500/10 text-yellow-500'
                          )}
                        >
                          {container.restarts}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm">{container.cpu}</td>
                      <td className="py-4 px-4 font-mono text-sm">{container.memory}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedContainerForLogs(container.name)}
                            title="View Logs"
                          >
                            <ScrollText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedContainerForDetails(container.name)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActionConfirm({ type: 'restart', containerName: container.name })}
                            title="Restart"
                            disabled={restartContainer.isPending}
                          >
                            <RotateCcw className={cn('h-4 w-4', restartContainer.isPending && 'animate-spin')} />
                          </Button>
                          {container.status === 'running' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionConfirm({ type: 'stop', containerName: container.name })}
                              title="Stop"
                              disabled={stopContainer.isPending}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionConfirm({ type: 'start', containerName: container.name })}
                              title="Start"
                              disabled={startContainer.isPending}
                              className="text-green-500 hover:text-green-600"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Container className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Docker containers detected</p>
              <p className="text-sm mt-1">Make sure Docker is running and accessible</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Backups
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {backupStorage?.isRemoteStorage ? (
                  <><Cloud className="h-4 w-4 text-green-500" /> Remote Storage</>
                ) : (
                  <><CloudOff className="h-4 w-4 text-muted-foreground" /> Local Storage</>
                )}
                {backupStorage && (
                  <span className="text-muted-foreground">
                    &bull; {backupStorage.totalSize} used
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBackups()}
              disabled={backupsLoading}
            >
              <RefreshCw className={cn('h-4 w-4', backupsLoading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MongoDB Backups */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4" />
                  <h4 className="font-medium">MongoDB Backups</h4>
                  <Badge variant="outline" className="ml-auto">
                    {backups?.mongodb?.length || 0} backup(s)
                  </Badge>
                </div>
                {backups?.mongodb && backups.mongodb.length > 0 ? (
                  <div className="space-y-2">
                    {backups.mongodb.map((backup) => (
                      <div
                        key={backup.filename}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Archive className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-mono">{backup.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(backup.created), 'PPp')} &bull; {backup.size}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteBackupConfirm({ type: 'mongodb', filename: backup.filename })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No MongoDB backups found
                  </p>
                )}
              </div>

              {/* PostgreSQL Backup */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4" />
                  <h4 className="font-medium">PostgreSQL Backup</h4>
                  <Badge variant="outline" className="ml-auto">
                    Single copy
                  </Badge>
                </div>
                {backups?.postgresql ? (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-mono">{backups.postgresql.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(backups.postgresql.created), 'PPp')} &bull; {backups.postgresql.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteBackupConfirm({ type: 'postgresql', filename: backups.postgresql!.filename })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No PostgreSQL backup found
                  </p>
                )}
              </div>

              {/* Last backup info */}
              {backups?.lastBackup && (
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  Last backup: {formatDistanceToNow(new Date(backups.lastBackup), { addSuffix: true })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disk Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Disk Usage
          </CardTitle>
          <CardDescription>
            Storage utilization across mounted volumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disksLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : disks && disks.length > 0 ? (
            <div className="space-y-6">
              {disks.map((disk) => (
                <div key={disk.filesystem} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{disk.mountPoint}</span>
                    <span className="text-muted-foreground font-mono">
                      {disk.used} / {disk.size} ({disk.usePercent}%)
                    </span>
                  </div>
                  <Progress
                    value={disk.usePercent}
                    className={cn(
                      'h-3',
                      disk.usePercent >= 90 && '[&>div]:bg-red-500',
                      disk.usePercent >= 70 && disk.usePercent < 90 && '[&>div]:bg-yellow-500'
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No disk information available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Container Logs Modal */}
      <Dialog open={!!selectedContainerForLogs} onOpenChange={(open) => {
        if (!open) {
          setSelectedContainerForLogs(null)
          setLiveTailEnabled(false)
          setLogSearch('')
          setLogLevelFilter('all')
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Container Logs: {selectedContainerForLogs}
            </DialogTitle>
            <DialogDescription>
              View and filter container logs
            </DialogDescription>
          </DialogHeader>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-b">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Log Level Filter */}
            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
            </select>

            {/* Lines selector */}
            <select
              value={logLines}
              onChange={(e) => setLogLines(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value={50}>50 lines</option>
              <option value={100}>100 lines</option>
              <option value={200}>200 lines</option>
              <option value={500}>500 lines</option>
              <option value={1000}>1000 lines</option>
            </select>

            {/* Live Tail Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="live-tail"
                checked={liveTailEnabled}
                onCheckedChange={setLiveTailEnabled}
              />
              <Label htmlFor="live-tail" className="text-sm whitespace-nowrap">
                Live Tail
              </Label>
              {liveTailEnabled && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                disabled={logsLoading}
              >
                <RefreshCw className={cn('h-4 w-4', logsLoading && 'animate-spin')} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLogs}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
                title="Download logs"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Timestamp */}
          {containerLogs?.timestamp && (
            <div className="text-xs text-muted-foreground py-2">
              Last fetched: {format(new Date(containerLogs.timestamp), 'HH:mm:ss')}
              {logSearch && ` • Showing ${filteredLogs.split('\n').filter(Boolean).length} matching lines`}
            </div>
          )}

          {/* Logs Content */}
          <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-zinc-950">
            {logsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs ? (
              <pre className="p-4 text-xs font-mono text-zinc-100 whitespace-pre-wrap break-all leading-relaxed">
                {filteredLogs.split('\n').map((line, idx) => {
                  const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('err')
                  const isWarn = line.toLowerCase().includes('warn')
                  const hasSearchMatch = logSearch && line.toLowerCase().includes(logSearch.toLowerCase())

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'py-0.5',
                        isError && 'text-red-400 bg-red-500/10',
                        isWarn && !isError && 'text-yellow-400 bg-yellow-500/10',
                        hasSearchMatch && 'bg-blue-500/20'
                      )}
                    >
                      {line}
                    </div>
                  )
                })}
              </pre>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No logs available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Container Details Modal */}
      <Dialog open={!!selectedContainerForDetails} onOpenChange={(open) => !open && setSelectedContainerForDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Container Details: {selectedContainerForDetails}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : containerDetails ? (
            <Tabs defaultValue="overview" className="flex-1">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ports">Ports</TabsTrigger>
                <TabsTrigger value="volumes">Volumes</TabsTrigger>
                <TabsTrigger value="env">Environment</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Container className="h-4 w-4" />
                      <span className="text-sm">Container ID</span>
                    </div>
                    <p className="font-mono text-sm">{containerDetails.id}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Settings2 className="h-4 w-4" />
                      <span className="text-sm">Status</span>
                    </div>
                    <Badge
                      className={cn(
                        containerDetails.status === 'running' && 'bg-green-500/10 text-green-500',
                        containerDetails.status === 'exited' && 'bg-red-500/10 text-red-500'
                      )}
                    >
                      {containerDetails.status}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm">CPU Limit</span>
                    </div>
                    <p className="font-mono text-sm">{containerDetails.resources.cpuLimit}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Database className="h-4 w-4" />
                      <span className="text-sm">Memory Limit</span>
                    </div>
                    <p className="font-mono text-sm">{containerDetails.resources.memoryLimit}</p>
                  </div>
                </div>

                {containerDetails.healthCheck && (
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-medium">Health Check</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status: </span>
                        <Badge className={cn(
                          containerDetails.healthCheck.status === 'healthy' && 'bg-green-500/10 text-green-500',
                          containerDetails.healthCheck.status === 'unhealthy' && 'bg-red-500/10 text-red-500'
                        )}>
                          {containerDetails.healthCheck.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failing Streak: </span>
                        <span>{containerDetails.healthCheck.failingStreak}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Created</span>
                  </div>
                  <p className="text-sm">{format(new Date(containerDetails.created), 'PPP HH:mm:ss')}</p>
                </div>
              </TabsContent>

              <TabsContent value="ports" className="mt-4">
                {containerDetails.ports.length > 0 ? (
                  <div className="space-y-2">
                    {containerDetails.ports.map((port, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{port.hostPort}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono">{port.containerPort}</span>
                        </div>
                        <Badge variant="secondary">{port.protocol}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No port mappings configured</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="volumes" className="mt-4">
                {containerDetails.volumes.length > 0 ? (
                  <div className="space-y-2">
                    {containerDetails.volumes.map((vol, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm truncate">{vol.source}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-sm truncate">{vol.destination}</span>
                          <Badge variant="secondary" className="ml-auto">{vol.mode}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No volumes mounted</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="env" className="mt-4">
                <div className="max-h-[400px] overflow-auto rounded-lg border bg-muted/30">
                  <div className="p-4 space-y-1">
                    {containerDetails.environment.map((env, idx) => {
                      const [key, ...valueParts] = env.split('=')
                      const value = valueParts.join('=')
                      return (
                        <div key={idx} className="font-mono text-xs">
                          <span className="text-blue-400">{key}</span>
                          <span className="text-muted-foreground">=</span>
                          <span className="text-green-400">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="network" className="mt-4">
                <div className="space-y-2">
                  {containerDetails.networks.map((network, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{network}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load container details
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionConfirm} onOpenChange={(open) => !open && setActionConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionConfirm?.type === 'restart' && 'Restart Container?'}
              {actionConfirm?.type === 'stop' && 'Stop Container?'}
              {actionConfirm?.type === 'start' && 'Start Container?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionConfirm?.type === 'restart' && (
                <>This will restart <strong>{actionConfirm.containerName}</strong>. The container will be briefly unavailable.</>
              )}
              {actionConfirm?.type === 'stop' && (
                <>This will stop <strong>{actionConfirm.containerName}</strong>. The service will become unavailable until started again.</>
              )}
              {actionConfirm?.type === 'start' && (
                <>This will start <strong>{actionConfirm.containerName}</strong>.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContainerAction}
              className={cn(
                actionConfirm?.type === 'stop' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {actionConfirm?.type === 'restart' && 'Restart'}
              {actionConfirm?.type === 'stop' && 'Stop'}
              {actionConfirm?.type === 'start' && 'Start'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Backup Confirmation Dialog */}
      <AlertDialog open={!!deleteBackupConfirm} onOpenChange={(open) => !open && setDeleteBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteBackupConfirm?.filename}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
