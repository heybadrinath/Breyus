import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ServiceHealth {
  status: HealthStatus
  latency?: number
  message?: string
  details?: Record<string, any>
}

export interface SystemHealth {
  overall: HealthStatus
  lastChecked: string
  services: {
    api: ServiceHealth
    mongodb: ServiceHealth
    redis: ServiceHealth
    postgres: ServiceHealth
    aiService: ServiceHealth
    frontend: ServiceHealth
    websocket: ServiceHealth
  }
  system: {
    uptime: number
    loadAverage: number[]
    memoryUsage: {
      total: number
      used: number
      free: number
      percent: number
    }
    cpuUsage: number
  }
}

export interface ContainerInfo {
  name: string
  status: 'running' | 'stopped' | 'restarting' | 'paused'
  uptime: string
  restarts: number
  cpu: string
  memory: string
  image: string
}

export interface DiskUsage {
  filesystem: string
  size: string
  used: string
  available: string
  usePercent: number
  mountPoint: string
}

export interface MaintenanceConfig {
  isEnabled: boolean
  message: string
  estimatedEndTime?: string
  scheduledStart?: string
  scheduledEnd?: string
  allowedIPs: string[]
}

export interface SSLCertificateInfo {
  domain: string
  issuer: string
  expiryDate: string
  daysRemaining: number
  status: 'valid' | 'expiring_soon' | 'expired'
}

export interface EnhancedDatabaseStats {
  mongodb: {
    collections: number
    documents: number
    dataSize: string
    indexSize: string
    opsPerSec: number
  }
  postgres: {
    activeConnections: number
    maxConnections: number
    status: string
  }
  redis: {
    usedMemory: string
    connectedClients: number
    totalKeys: number
  }
}

export interface ScriptResult {
  success: boolean
  output: string
  error?: string
  duration: number
  timestamp: string
}

interface SystemHealthResponse {
  statusCode: number
  message: string
  data: SystemHealth
}

interface ContainerResponse {
  statusCode: number
  message: string
  data: ContainerInfo[]
}

interface DiskResponse {
  statusCode: number
  message: string
  data: DiskUsage[]
}

interface MaintenanceResponse {
  statusCode: number
  message: string
  data: MaintenanceConfig
}

interface SSLResponse {
  statusCode: number
  message: string
  data: SSLCertificateInfo[]
}

interface DatabaseStatsResponse {
  statusCode: number
  message: string
  data: EnhancedDatabaseStats
}

interface ScriptResultResponse {
  statusCode: number
  message: string
  data: ScriptResult
}

interface HealthCheckResponse {
  statusCode: number
  message: string
  data: {
    health: SystemHealth
    scriptResult: ScriptResult
  }
}

export interface ContainerLogsResponse {
  statusCode: number
  message: string
  data: {
    success: boolean
    logs: string
    containerName: string
    timestamp: string
  }
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const { data } = await api.get<SystemHealthResponse>('/admin/system/health')
      return data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useContainerStatus() {
  return useQuery({
    queryKey: ['system', 'containers'],
    queryFn: async () => {
      const { data } = await api.get<ContainerResponse>('/admin/system/health/containers')
      return data.data
    },
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useDiskUsage() {
  return useQuery({
    queryKey: ['system', 'disk'],
    queryFn: async () => {
      const { data } = await api.get<DiskResponse>('/admin/system/health/disk')
      return data.data
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  })
}

export function useMaintenance() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['system', 'maintenance'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceResponse>('/admin/system/maintenance')
      return data.data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (payload: {
      isEnabled: boolean
      message?: string
      estimatedEndTime?: string
      allowedIPs?: string[]
    }) => {
      const { data } = await api.put<MaintenanceResponse>('/admin/system/maintenance', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'maintenance'] })
    },
  })

  return {
    ...query,
    toggle: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  }
}

export function useScheduleMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: {
      scheduledStart: string
      scheduledEnd: string
      message?: string
      allowedIPs?: string[]
    }) => {
      const { data } = await api.post<MaintenanceResponse>('/admin/system/maintenance/schedule', dto)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'maintenance'] })
    },
  })
}

export function useCancelScheduledMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<MaintenanceResponse>('/admin/system/maintenance/schedule')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'maintenance'] })
    },
  })
}

export function useSSLCertificates() {
  return useQuery({
    queryKey: ['system', 'ssl'],
    queryFn: async () => {
      const { data } = await api.get<SSLResponse>('/admin/system/health/ssl')
      return data.data
    },
    refetchInterval: 3600000, // Refresh every hour
  })
}

export function useRenewCerts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (domains?: string[]) => {
      const { data } = await api.post<{ statusCode: number; message: string; data: { success: boolean; message: string; output?: string } }>(
        '/admin/system/ssl/renew',
        { domains }
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'ssl'] })
    },
  })
}

export function useEnhancedDatabaseStats() {
  return useQuery({
    queryKey: ['system', 'database-stats'],
    queryFn: async () => {
      const { data } = await api.get<DatabaseStatsResponse>('/admin/system/health/databases/stats')
      return data.data
    },
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useQuickActions() {
  const queryClient = useQueryClient()

  const createBackup = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ScriptResultResponse>('/admin/system/actions/backup')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })

  const rotateLogs = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ScriptResultResponse>('/admin/system/actions/rotate-logs')
      return data.data
    },
  })

  const runHealthCheck = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<HealthCheckResponse>('/admin/system/actions/health-check')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'health'] })
    },
  })

  return { createBackup, rotateLogs, runHealthCheck }
}

export function useContainerLogs(containerName: string | null, lines: number = 100) {
  return useQuery({
    queryKey: ['system', 'container-logs', containerName, lines],
    queryFn: async () => {
      if (!containerName) return null
      const { data } = await api.get<ContainerLogsResponse>(
        `/admin/system/health/containers/${encodeURIComponent(containerName)}/logs`,
        { params: { lines } }
      )
      return data.data
    },
    enabled: !!containerName,
    staleTime: 0, // Always fetch fresh logs
    refetchOnWindowFocus: false,
  })
}

export interface ContainerDetails {
  id: string
  name: string
  image: string
  status: string
  created: string
  ports: Array<{ hostPort: string; containerPort: string; protocol: string }>
  volumes: Array<{ source: string; destination: string; mode: string }>
  environment: string[]
  networks: string[]
  healthCheck: {
    status: string
    failingStreak: number
    lastCheck: string
  } | null
  resources: {
    cpuLimit: string
    memoryLimit: string
  }
}

export function useContainerDetails(containerName: string | null) {
  return useQuery({
    queryKey: ['system', 'container-details', containerName],
    queryFn: async () => {
      if (!containerName) return null
      const { data } = await api.get<{ statusCode: number; message: string; data: ContainerDetails }>(
        `/admin/system/health/containers/${encodeURIComponent(containerName)}/details`
      )
      return data.data
    },
    enabled: !!containerName,
    staleTime: 30000,
  })
}

export function useContainerActions() {
  const queryClient = useQueryClient()

  const restartContainer = useMutation({
    mutationFn: async (containerName: string) => {
      const { data } = await api.post<{ statusCode: number; message: string; data: { success: boolean; message: string } }>(
        `/admin/system/health/containers/${encodeURIComponent(containerName)}/restart`
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'containers'] })
    },
  })

  const stopContainer = useMutation({
    mutationFn: async (containerName: string) => {
      const { data } = await api.post<{ statusCode: number; message: string; data: { success: boolean; message: string } }>(
        `/admin/system/health/containers/${encodeURIComponent(containerName)}/stop`
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'containers'] })
    },
  })

  const startContainer = useMutation({
    mutationFn: async (containerName: string) => {
      const { data } = await api.post<{ statusCode: number; message: string; data: { success: boolean; message: string } }>(
        `/admin/system/health/containers/${encodeURIComponent(containerName)}/start`
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'containers'] })
    },
  })

  return { restartContainer, stopContainer, startContainer }
}

// ==================== BACKUP MANAGEMENT ====================

export interface BackupInfo {
  filename: string
  size: string
  created: Date
}

export interface BackupList {
  mongodb: BackupInfo[]
  postgresql: BackupInfo | null
  lastBackup: Date | null
}

export interface BackupStorageInfo {
  path: string
  totalSize: string
  mongoBackupCount: number
  hasPostgresBackup: boolean
  isRemoteStorage: boolean
}

export function useBackups() {
  return useQuery({
    queryKey: ['system', 'backups'],
    queryFn: async () => {
      const { data } = await api.get<{ statusCode: number; message: string; data: BackupList }>(
        '/admin/system/backups'
      )
      return data.data
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useBackupStorage() {
  return useQuery({
    queryKey: ['system', 'backup-storage'],
    queryFn: async () => {
      const { data } = await api.get<{ statusCode: number; message: string; data: BackupStorageInfo }>(
        '/admin/system/backups/storage'
      )
      return data.data
    },
    staleTime: 60000, // 1 minute
  })
}

export type BackupTarget = 'all' | 'mongo' | 'postgres'

export function useBackupActions() {
  const queryClient = useQueryClient()

  const createBackup = useMutation({
    mutationFn: async (target: BackupTarget = 'all') => {
      const { data } = await api.post<ScriptResultResponse>(
        '/admin/system/actions/backup',
        { target }
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'backups'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'backup-storage'] })
    },
  })

  const deleteBackup = useMutation({
    mutationFn: async ({ type, filename }: { type: 'mongodb' | 'postgresql'; filename: string }) => {
      const { data } = await api.delete<{ statusCode: number; message: string; data: { success: boolean; message: string } }>(
        `/admin/system/backups/${type}/${encodeURIComponent(filename)}`
      )
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'backups'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'backup-storage'] })
    },
  })

  return { createBackup, deleteBackup }
}
