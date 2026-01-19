export interface ActivityLog {
  _id: string
  adminId: string
  adminEmail: string
  action: string
  actionCategory: string
  targetType?: string
  targetId?: string
  targetIdentifier?: string
  description: string
  previousValue?: Record<string, any>
  newValue?: Record<string, any>
  metadata?: {
    ipAddress?: string
    userAgent?: string
    requestId?: string
    duration?: number
    notes?: string
    companyId?: string
    [key: string]: any
  }
  timestamp: string
  createdAt: string
  updatedAt: string
}

export interface ActivityLogsQueryParams {
  page?: number
  limit?: number
  adminId?: string
  actionCategory?: string
  action?: string
  targetType?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface PaginatedActivityLogsResponse {
  data: ActivityLog[]
  total: number
  page: number
  totalPages: number
}

export interface ActivitySummary {
  category: string
  count: number
}

// Action category options for filters
export const ACTION_CATEGORIES = [
  { value: 'auth', label: 'Authentication' },
  { value: 'users', label: 'Users' },
  { value: 'companies', label: 'Companies' },
  { value: 'trades', label: 'Trades' },
  { value: 'products', label: 'Products' },
  { value: 'kyc', label: 'KYC' },
  { value: 'system', label: 'System' },
  { value: 'content', label: 'Content' },
] as const

// Target type options for filters
export const TARGET_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'company', label: 'Company' },
  { value: 'trade', label: 'Trade' },
  { value: 'product', label: 'Product' },
  { value: 'document', label: 'Document' },
] as const
