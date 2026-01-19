// Blocked IP Types
export interface BlockedIP {
  _id: string;
  ipAddress: string;
  reason: string;
  blockedBy: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | string;
  blockedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockIPRequest {
  ipAddress: string;
  reason: string;
  expiresAt?: string;
}

// Failed Login Types
export enum FailedLoginReason {
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SUSPENDED = 'USER_SUSPENDED',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  IP_BLOCKED = 'IP_BLOCKED',
}

export interface FailedLoginAttempt {
  _id: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  attemptedAt: string;
  reason: FailedLoginReason;
  createdAt: string;
  updatedAt: string;
}

export interface FailedLoginsQuery {
  page?: number;
  limit?: number;
  email?: string;
  ipAddress?: string;
  reason?: FailedLoginReason;
  startDate?: string;
  endDate?: string;
}

export interface FailedLoginStats {
  total: number;
  byReason: Array<{
    reason: FailedLoginReason;
    count: number;
  }>;
  topIPs: Array<{
    ipAddress: string;
    count: number;
    uniqueEmails: number;
  }>;
  topEmails: Array<{
    email: string;
    count: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    count: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

// API Response Types
export interface BlockedIPsResponse {
  statusCode: number;
  message: string;
  data: BlockedIP[];
}

export interface FailedLoginsResponse {
  statusCode: number;
  message: string;
  data: FailedLoginAttempt[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface FailedLoginStatsResponse {
  statusCode: number;
  message: string;
  data: FailedLoginStats;
}
