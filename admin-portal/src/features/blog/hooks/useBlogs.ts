import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BlogPost,
  BlogPostsResponse,
  BlogQueryParams,
  BlogStats,
  CreateBlogPostDto,
  UpdateBlogPostDto,
  ImageUploadResponse,
} from '../types';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Fetch paginated blog posts with filters
 */
export function useBlogPosts(params: BlogQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'blog', 'posts', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BlogPostsResponse>>(
        '/admin/blog/posts',
        { params }
      );
      return data.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Fetch single blog post by ID
 */
export function useBlogPost(postId: string) {
  return useQuery({
    queryKey: ['admin', 'blog', 'posts', postId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}`
      );
      return data.data;
    },
    enabled: !!postId,
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch blog statistics
 */
export function useBlogStats() {
  return useQuery({
    queryKey: ['admin', 'blog', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BlogStats>>('/admin/blog/stats');
      return data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Create a new blog post
 */
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateBlogPostDto) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        '/admin/blog/posts',
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Update an existing blog post
 */
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: UpdateBlogPostDto;
    }) => {
      const response = await api.patch<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Publish a draft blog post
 */
export function usePublishBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/publish`
      );
      return response.data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Unpublish a blog post (revert to draft)
 */
export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/unpublish`
      );
      return response.data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Delete a blog post (soft delete)
 */
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/blog/posts/${postId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Restore a deleted blog post
 */
export function useRestoreBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/restore`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Upload an image for blog content
 */
export function useUploadBlogImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<ApiResponse<ImageUploadResponse>>(
        '/admin/blog/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
  });
}
