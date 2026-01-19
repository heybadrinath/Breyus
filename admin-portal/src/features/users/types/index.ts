export interface User {
  _id: string
  mail: string
  role: 'admin' | 'user'
  displayRole: 'Buyer' | 'Seller'
  company?: {
    _id: string
    companyName: string
    role: string
    isVerified: boolean
  }
  isSuspended: boolean
  suspendedAt?: string
  suspensionReason?: string
  suspendedBy?: string
  notificationPreferences?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  totalTrades: number
  activeTrades: number
  completedTrades: number
}

export interface UsersQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: 'Buyer' | 'Seller'
  isSuspended?: boolean
  sortBy?: 'createdAt' | 'mail' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

export interface PaginatedUsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserDetailResponse {
  user: User
  stats: UserStats
}

export interface UpdateUserDto {
  mail?: string
  role?: 'admin' | 'user'
}

export interface SuspendUserDto {
  reason: string
}

// Stats for the users list page KPI cards
export interface UserPageStats {
  total: number
  active: number
  suspended: number
  newThisMonth: number
  totalChange?: number
  activeChange?: number
  suspendedChange?: number
  newThisMonthChange?: number
}
