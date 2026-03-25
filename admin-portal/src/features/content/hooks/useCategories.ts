import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  ProductCategory,
  CategoriesQueryParams,
  CategoriesResponse,
  CategoryTreeResponse,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
  SeedResult,
} from '../types'

// Get categories flat list
export function useCategories(params: CategoriesQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CategoriesResponse>>(
        '/admin/content/categories',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get category tree
export function useCategoryTree() {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', 'tree'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CategoryTreeResponse>>(
        '/admin/content/categories/tree'
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single category by ID
export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', categoryId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProductCategory>>(
        `/admin/content/categories/${categoryId}`
      )
      return data.data
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60,
  })
}

// Get children of a category
export function useCategoryChildren(categoryId: string) {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', categoryId, 'children'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProductCategory[]>>(
        `/admin/content/categories/${categoryId}/children`
      )
      return data.data
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60,
  })
}

// Create category mutation
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateCategoryDto) => {
      const response = await api.post<ApiResponse<ProductCategory>>(
        '/admin/content/categories',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Update category mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: UpdateCategoryDto }) => {
      const response = await api.patch<ApiResponse<ProductCategory>>(
        `/admin/content/categories/${categoryId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content', 'categories', variables.categoryId],
      })
    },
  })
}

// Delete category mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/content/categories/${categoryId}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Reorder category mutation
export function useReorderCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: ReorderCategoriesDto) => {
      const response = await api.post<ApiResponse<CategoryTreeResponse>>(
        '/admin/content/categories/reorder',
        dto
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Seed default categories mutation
export function useSeedCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<SeedResult>>(
        '/admin/content/categories/seed'
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Seed mainstream classification for existing leaf categories
export function useSeedMainstreamClassification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{
        totalLeafCategories: number
        updated: number
        alreadyClassified: number
        total: number
        mainstream: number
        niche: number
      }>>('/admin/content/categories/seed-mainstream')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
    },
  })
}

// ==========================================================
// MAINSTREAM/NICHE CLASSIFICATION HOOKS
// ==========================================================

// Toggle mainstream/niche classification
export function useToggleCategoryMainstream() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, isMainstream }: { categoryId: string; isMainstream: boolean }) => {
      const response = await api.post<ApiResponse<ProductCategory>>(
        `/admin/content/categories/${categoryId}/toggle-mainstream`,
        { isMainstream }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Get pending user-submitted categories
export function usePendingCategories() {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CategoriesResponse>>(
        '/admin/content/categories/pending'
      )
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds (more frequent updates for pending items)
  })
}

// Approve a user-submitted category with optional edits
export interface ApproveCategoryData {
  categoryId: string
  edits?: {
    name?: string
    parentId?: string | null
    isMainstream?: boolean
    aliases?: string[]
    hsCodePrefix?: string
  }
}

export function useApproveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApproveCategoryData) => {
      const response = await api.post<ApiResponse<ProductCategory>>(
        `/admin/content/categories/${data.categoryId}/approve`,
        data.edits || {}
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}

// Get categories grouped by classification (for display purposes)
export function useCategoriesGroupedByClassification() {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', 'grouped-classification'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        mainstream: ProductCategory[]
        niche: ProductCategory[]
      }>>('/admin/content/categories/grouped-classification')
      return data.data
    },
    staleTime: 1000 * 60,
  })
}

// Get commodity classification stats
export function useCommodityClassificationStats() {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', 'commodity-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        total: number
        mainstream: number
        niche: number
        active: number
        inactive: number
        pendingReview: number
      }>>('/admin/content/categories/commodity-stats')
      return data.data
    },
    staleTime: 1000 * 60,
  })
}

// ==========================================================
// PENDING CATEGORY REJECTION HOOKS
// ==========================================================

// Get pending categories with linked product details
export interface PendingCategoryDetailed extends ProductCategory {
  linkedProducts: Array<{
    _id: string
    name: string
    user?: {
      mail?: string
      company?: {
        companyName?: string
        founderName?: string
      }
    }
  }>
  linkedProductCount: number
}

export function usePendingCategoriesDetailed() {
  return useQuery({
    queryKey: ['admin', 'content', 'categories', 'pending-detailed'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        categories: PendingCategoryDetailed[]
        total: number
      }>>('/admin/content/categories/pending-detailed')
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds (frequent updates for pending items)
  })
}

// Reject a pending category with product reassignment
export interface RejectCategoryData {
  categoryId: string
  replacementCategoryId: string
  rejectionReason?: string
}

export interface RejectCategoryResult {
  rejected: boolean
  categoryName: string
  replacementCategory: {
    _id: string
    name: string
    path: string
  }
  affectedProductCount: number
  affectedProducts: Array<{ _id: string; name: string }>
}

export function useRejectCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RejectCategoryData) => {
      const response = await api.post<ApiResponse<RejectCategoryResult>>(
        `/admin/content/categories/${data.categoryId}/reject`,
        {
          replacementCategoryId: data.replacementCategoryId,
          rejectionReason: data.rejectionReason,
        }
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate pending categories and tree
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'categories'] })
    },
  })
}
