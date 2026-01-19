export enum AlertEventType {
  USER_SUSPENDED = 'USER_SUSPENDED',
  KYC_PENDING_THRESHOLD = 'KYC_PENDING_THRESHOLD',
  TRADE_STALLED = 'TRADE_STALLED',
  FAILED_LOGIN_SPIKE = 'FAILED_LOGIN_SPIKE',
  NEW_DISPUTE = 'NEW_DISPUTE',
}

export enum AlertEmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface AlertRule {
  _id: string
  name: string
  eventType: AlertEventType
  isEnabled: boolean
  threshold?: number
  timeWindowMinutes?: number
  recipients: string[]
  cooldownMinutes: number
  lastTriggeredAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AlertHistory {
  _id: string
  ruleId: string
  ruleName: string
  eventType: AlertEventType
  triggeredAt: string
  payload: Record<string, any>
  recipientsSent: string[]
  emailStatus: AlertEmailStatus
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAlertRuleDto {
  name: string
  eventType: AlertEventType
  threshold?: number
  timeWindowMinutes?: number
  recipients: string[]
  cooldownMinutes?: number
}

export interface UpdateAlertRuleDto {
  name?: string
  threshold?: number
  timeWindowMinutes?: number
  recipients?: string[]
  cooldownMinutes?: number
}

export interface AlertHistoryQueryParams {
  page?: number
  limit?: number
  ruleId?: string
  eventType?: AlertEventType
  emailStatus?: AlertEmailStatus
  startDate?: string
  endDate?: string
}

export interface PaginatedAlertHistoryResponse {
  data: AlertHistory[]
  total: number
  page: number
  totalPages: number
}

// Event type labels for display
export const EVENT_TYPE_LABELS: Record<AlertEventType, string> = {
  [AlertEventType.USER_SUSPENDED]: 'User Suspended',
  [AlertEventType.KYC_PENDING_THRESHOLD]: 'KYC Pending Threshold',
  [AlertEventType.TRADE_STALLED]: 'Stalled Trade',
  [AlertEventType.FAILED_LOGIN_SPIKE]: 'Failed Login Spike',
  [AlertEventType.NEW_DISPUTE]: 'New Dispute',
}

// Event type descriptions
export const EVENT_TYPE_DESCRIPTIONS: Record<AlertEventType, string> = {
  [AlertEventType.USER_SUSPENDED]: 'Triggers when an admin suspends a user',
  [AlertEventType.KYC_PENDING_THRESHOLD]: 'Triggers when pending KYC documents exceed threshold',
  [AlertEventType.TRADE_STALLED]: 'Triggers when trades are inactive beyond threshold',
  [AlertEventType.FAILED_LOGIN_SPIKE]: 'Triggers when failed login attempts spike',
  [AlertEventType.NEW_DISPUTE]: 'Triggers when a new dispute is created',
}
