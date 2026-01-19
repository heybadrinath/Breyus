export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent'
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed'
export type DisputeReason =
  | 'payment_issue'
  | 'quality_issue'
  | 'delivery_delay'
  | 'documentation_problem'
  | 'communication_issue'
  | 'pricing_dispute'
  | 'contract_breach'
  | 'other'

export interface DisputeMessage {
  _id: string
  content: string
  sender: {
    _id: string
    mail?: string
    email?: string
  }
  senderType: 'buyer' | 'seller' | 'admin'
  senderEmail?: string
  createdAt: string
  isInternal?: boolean
}

export interface TradeRef {
  _id: string
  tradePhase: string
  negotiationStatus: string
  product?: {
    _id: string
    name: string
  }
  buyer?: {
    _id: string
    mail: string
  }
  seller?: {
    _id: string
    mail: string
  }
}

export interface AdminRef {
  _id: string
  email: string
  name?: string
}

export interface UserRef {
  _id: string
  mail: string
}

export interface Dispute {
  _id: string
  trade: TradeRef
  raisedBy: UserRef
  raisedByRole: 'buyer' | 'seller'
  raisedByEmail: string
  reason: DisputeReason
  description: string
  priority: DisputePriority
  status: DisputeStatus
  assignedAdmin?: AdminRef
  assignedAdminEmail?: string
  assignedAt?: string
  resolutionNotes?: string
  resolvedAt?: string
  resolvedBy?: AdminRef
  resolvedByEmail?: string
  closedAt?: string
  closedBy?: AdminRef
  messages: DisputeMessage[]
  createdAt: string
  updatedAt: string
}

export interface DisputesQueryParams {
  page?: number
  limit?: number
  status?: DisputeStatus
  priority?: DisputePriority
  reason?: DisputeReason
  assignedTo?: string
  unassigned?: boolean
  tradeId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'priority' | 'status' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedDisputesResponse {
  disputes: Dispute[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DisputeStats {
  total: number
  open: number
  underReview: number
  resolved: number
  closed: number
  unassigned: number
  byPriority: Record<string, number>
  byReason: Record<string, number>
  avgResolutionTimeHours: number
}

export interface AssignDisputeDto {
  adminId: string
  notes?: string
}

export interface SelfAssignDisputeDto {
  notes?: string
}

export interface UpdateDisputeStatusDto {
  status: DisputeStatus
  notes?: string
}

export interface ResolveDisputeDto {
  resolutionNotes: string
}

export interface AddDisputeMessageDto {
  content: string
  isInternal?: boolean
}

// Helper function to get priority color (dark mode compatible)
export function getPriorityColor(priority: DisputePriority): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
    case 'high':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'medium':
      return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
    case 'low':
      return 'text-muted-foreground bg-muted border-border'
    default:
      return 'text-muted-foreground bg-muted border-border'
  }
}

// Helper function to get status color (dark mode compatible)
export function getStatusColor(status: DisputeStatus): string {
  switch (status) {
    case 'open':
      return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
    case 'under_review':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'resolved':
      return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20'
    case 'closed':
      return 'text-muted-foreground bg-muted border-border'
    default:
      return 'text-muted-foreground bg-muted border-border'
  }
}

// Helper function to format reason
export function formatReason(reason: DisputeReason): string {
  const reasonMap: Record<DisputeReason, string> = {
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
