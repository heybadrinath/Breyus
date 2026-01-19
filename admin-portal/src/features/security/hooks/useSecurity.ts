import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  BlockedIP,
  BlockIPRequest,
  BlockedIPsResponse,
  FailedLoginAttempt,
  FailedLoginsQuery,
  FailedLoginsResponse,
  FailedLoginStats,
  FailedLoginStatsResponse,
} from '../types';

// ============================================================================
// BLOCKED IPs HOOKS
// ============================================================================

export function useBlockedIPs(isActive?: boolean) {
  return useQuery<BlockedIP[]>({
    queryKey: ['admin', 'security', 'blocked-ips', { isActive }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isActive !== undefined) {
        params.append('isActive', String(isActive));
      }
      const queryString = params.toString();
      const url = `/admin/security/blocked-ips${queryString ? `?${queryString}` : ''}`;
      const response = await api.get<BlockedIPsResponse>(url);
      return response.data.data;
    },
  });
}

export function useBlockIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BlockIPRequest) => {
      const response = await api.post<{ data: BlockedIP }>(
        '/admin/security/blocked-ips',
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'blocked-ips'] });
    },
  });
}

export function useUnblockIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/security/blocked-ips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'blocked-ips'] });
    },
  });
}

// ============================================================================
// FAILED LOGINS HOOKS
// ============================================================================

export function useFailedLogins(params: FailedLoginsQuery = {}) {
  return useQuery<{
    data: FailedLoginAttempt[];
    pagination: FailedLoginsResponse['pagination'];
  }>({
    queryKey: ['admin', 'security', 'failed-logins', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.email) searchParams.append('email', params.email);
      if (params.ipAddress) searchParams.append('ipAddress', params.ipAddress);
      if (params.reason) searchParams.append('reason', params.reason);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const queryString = searchParams.toString();
      const url = `/admin/security/failed-logins${queryString ? `?${queryString}` : ''}`;
      const response = await api.get<FailedLoginsResponse>(url);
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    },
  });
}

export function useFailedLoginStats(startDate?: string, endDate?: string) {     
  return useQuery<FailedLoginStats>({
    queryKey: ['admin', 'security', 'failed-logins', 'stats', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const url = `/admin/security/failed-logins/stats${queryString ? `?${queryString}` : ''}`;
      const response = await api.get<FailedLoginStatsResponse>(url);      
      return response.data.data;
    },
  });
}
