import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  KycDocument,
  KycDocumentWithCompany,
  KycDocumentsQueryParams,
  PaginatedKycDocumentsResponse,
  KycStats,
} from '../types'

// Get paginated KYC documents
export function useKycDocuments(params: KycDocumentsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'kyc', 'documents', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const response = await api.get<PaginatedKycDocumentsResponse>(
        `/admin/kyc/documents?${searchParams.toString()}`
      )
      return response.data
    },
  })
}

// Get KYC stats
export function useKycStats() {
  return useQuery({
    queryKey: ['admin', 'kyc', 'stats'],
    queryFn: async () => {
      const response = await api.get<KycStats>('/admin/kyc/stats')
      return response.data
    },
  })
}

// Get single document
export function useKycDocument(companyId: string, documentId: string) {
  return useQuery({
    queryKey: ['admin', 'kyc', 'document', companyId, documentId],
    queryFn: async () => {
      const response = await api.get<KycDocumentWithCompany>(
        `/admin/kyc/companies/${companyId}/documents/${documentId}`
      )
      return response.data
    },
    enabled: !!companyId && !!documentId,
  })
}

// Approve document
export function useApproveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      documentId,
      notes,
    }: {
      companyId: string
      documentId: string
      notes?: string
    }) => {
      const response = await api.post<KycDocument>(
        `/admin/kyc/companies/${companyId}/documents/${documentId}/approve`,
        { notes }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
    },
  })
}

// Reject document
export function useRejectDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      documentId,
      notes,
    }: {
      companyId: string
      documentId: string
      notes: string
    }) => {
      const response = await api.post<KycDocument>(
        `/admin/kyc/companies/${companyId}/documents/${documentId}/reject`,
        { notes }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
    },
  })
}
