import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponse } from '@/lib/api'
import type {
  Product,
  ProductsQueryParams,
  PaginatedProductsResponse,
  ProductStats,
  DeactivateProductDto,
} from '../types'

// Get paginated list of products
export function useProducts(params: ProductsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedProductsResponse>>(
        '/admin/products',
        { params }
      )
      return data.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get single product by ID
export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['admin', 'products', productId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(
        `/admin/products/${productId}`
      )
      return data.data
    },
    enabled: !!productId,
    staleTime: 1000 * 30,
  })
}

// Get product statistics
export function useProductStats() {
  return useQuery({
    queryKey: ['admin', 'products', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProductStats>>(
        '/admin/products/stats'
      )
      return data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get all categories
export function useProductCategories() {
  return useQuery({
    queryKey: ['admin', 'products', 'categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>(
        '/admin/products/categories'
      )
      return data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Deactivate product mutation
export function useDeactivateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string
      data: DeactivateProductDto
    }) => {
      const response = await api.put<ApiResponse<Product>>(
        `/admin/products/${productId}/deactivate`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products', variables.productId],
      })
    },
  })
}

// Reactivate product mutation
export function useReactivateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.put<ApiResponse<Product>>(
        `/admin/products/${productId}/reactivate`
      )
      return response.data
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products', productId],
      })
    },
  })
}

// Feature product mutation
export function useFeatureProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.put<ApiResponse<Product>>(
        `/admin/products/${productId}/feature`
      )
      return response.data
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products', productId],
      })
    },
  })
}

// Unfeature product mutation
export function useUnfeatureProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.put<ApiResponse<Product>>(
        `/admin/products/${productId}/unfeature`
      )
      return response.data
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products', productId],
      })
    },
  })
}
