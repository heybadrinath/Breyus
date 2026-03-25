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
  BlogWriter,
  WriterInvite,
  NewsletterSubscribersResponse,
  NewsletterSubscriberStats,
  NewsletterSubscriberQueryParams,
} from '../types';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

// ─────────────────────────────────────────────────────────────
// Blog Post Queries
// ─────────────────────────────────────────────────────────────

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
    staleTime: 1000 * 30,
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
    staleTime: 1000 * 60,
  });
}

/**
 * Check if a slug is available (not already in use)
 * Fix: Client-side slug validation to prevent duplicate slug errors
 */
export function useCheckSlugAvailability() {
  return useMutation({
    mutationFn: async ({ slug, excludePostId }: { slug: string; excludePostId?: string }) => {
      const params: Record<string, string> = { slug };
      if (excludePostId) {
        params.excludePostId = excludePostId;
      }
      const { data } = await api.get<ApiResponse<{ available: boolean; existingPostId?: string }>>(
        '/admin/blog/posts/check-slug',
        { params }
      );
      return data.data;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Blog Post CRUD Mutations
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Publishing Workflow Mutations
// ─────────────────────────────────────────────────────────────

/**
 * Publish an approved blog post
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

// ─────────────────────────────────────────────────────────────
// Editorial Workflow Mutations
// ─────────────────────────────────────────────────────────────

/**
 * Approve a submitted blog post
 */
export function useApproveBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/approve`
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
 * Reject a submitted blog post
 */
export function useRejectBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/reject`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

/**
 * Request revision on a submitted blog post
 */
export function useRequestRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, notes }: { postId: string; notes: string }) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/request-revision`,
        { notes }
      );
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'stats'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Feature Toggles
// ─────────────────────────────────────────────────────────────

/**
 * Toggle featured status
 */
export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/toggle-featured`
      );
      return response.data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
    },
  });
}

/**
 * Toggle pinned status
 */
export function useTogglePinned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/toggle-pinned`
      );
      return response.data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
    },
  });
}

/**
 * Update access level
 */
export function useUpdateAccessLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      accessLevel,
    }: {
      postId: string;
      accessLevel: 'public' | 'member_only';
    }) => {
      const response = await api.patch<ApiResponse<BlogPost>>(
        `/admin/blog/posts/${postId}/access-level`,
        { accessLevel }
      );
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'blog', 'posts', postId],
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Image Upload
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Writers (for Phase 4)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all writers
 */
export function useWriters() {
  return useQuery({
    queryKey: ['admin', 'blog', 'writers'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ writers: BlogWriter[] }>>(
        '/admin/blog/writers'
      );
      return data.data?.writers || [];
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch writer invites
 */
export function useWriterInvites() {
  return useQuery({
    queryKey: ['admin', 'blog', 'invites'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ invites: WriterInvite[] }>>(
        '/admin/blog/invites'
      );
      return data.data?.invites || [];
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Generate new writer invite
 */
export function useCreateWriterInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { emailHint?: string; adminNote?: string }) => {
      const response = await api.post<ApiResponse<WriterInvite>>(
        '/admin/blog/invites',
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'invites'] });
    },
  });
}

/**
 * Revoke writer invite
 */
export function useRevokeWriterInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/blog/invites/${inviteId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'invites'] });
    },
  });
}

/**
 * Remove writer status from a user
 */
export function useRemoveWriter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (writerId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/blog/writers/${writerId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'writers'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Blog Users Management
// ─────────────────────────────────────────────────────────────

export interface BlogUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  isBrèyusMember: boolean;
  isWriter: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogUsersStats {
  totalUsers: number;
  breyusMembers: number;
  blogOnlyUsers: number;
  writers: number;
  suspendedUsers: number;
  recentSignups: number;
}

export interface BlogUsersResponse {
  users: BlogUser[];
  total: number;
  page: number;
  pages: number;
}

export interface BlogUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isBrèyusMember?: boolean;
  isWriter?: boolean;
  isSuspended?: boolean;
}

/**
 * Fetch blog users with filters
 */
export function useBlogUsers(params: BlogUserQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'blog', 'users', params],
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
        page: params.page,
        limit: params.limit,
        search: params.search,
      };

      // Convert booleans to strings for query params
      if (params.isBrèyusMember !== undefined) {
        queryParams.isBrèyusMember = String(params.isBrèyusMember);
      }
      if (params.isWriter !== undefined) {
        queryParams.isWriter = String(params.isWriter);
      }
      if (params.isSuspended !== undefined) {
        queryParams.isSuspended = String(params.isSuspended);
      }

      const { data } = await api.get<ApiResponse<BlogUsersResponse>>(
        '/admin/blog/users',
        { params: queryParams }
      );
      return data.data;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch blog users statistics
 */
export function useBlogUsersStats() {
  return useQuery({
    queryKey: ['admin', 'blog', 'users', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BlogUsersStats>>(
        '/admin/blog/users/stats'
      );
      return data.data;
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch single blog user
 */
export function useBlogUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'blog', 'users', userId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        user: BlogUser;
        postStats: {
          totalPosts: number;
          publishedPosts: number;
          totalViews: number;
          totalLikes: number;
        } | null;
        readerStats: {
          totalLikesGiven: number;
          totalComments: number;
          recentActivity: Array<{
            _id: string;
            type: 'like' | 'comment';
            createdAt: string;
            postId: string;
            postTitle: string;
            postSlug: string | null;
            content?: string;
          }>;
        };
      }>>(`/admin/blog/users/${userId}`);
      return data.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

/**
 * Suspend a blog user
 */
export function useSuspendBlogUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await api.patch<ApiResponse<void>>(
        `/admin/blog/users/${userId}/suspend`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', userId] });
    },
  });
}

/**
 * Unsuspend a blog user
 */
export function useUnsuspendBlogUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch<ApiResponse<void>>(
        `/admin/blog/users/${userId}/unsuspend`
      );
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', userId] });
    },
  });
}

/**
 * Delete a blog user
 */
export function useDeleteBlogUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/blog/users/${userId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users'] });
    },
  });
}

/**
 * Promote a user to writer
 */
export function usePromoteToWriter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch<ApiResponse<BlogUser>>(
        `/admin/blog/users/${userId}/promote-writer`
      );
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', 'stats'] });
    },
  });
}

/**
 * Revoke writer status from a user
 */
export function useRevokeWriterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch<ApiResponse<BlogUser>>(
        `/admin/blog/users/${userId}/revoke-writer`
      );
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'users', 'stats'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Newsletter Subscriber Management
// ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated newsletter subscribers with filters
 */
export function useNewsletterSubscribers(params: NewsletterSubscriberQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'blog', 'subscribers', params],
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
        page: params.page,
        limit: params.limit,
        search: params.search,
        source: params.source,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      if (params.isActive !== undefined) {
        queryParams.isActive = String(params.isActive);
      }

      const { data } = await api.get<ApiResponse<NewsletterSubscribersResponse>>(
        '/admin/blog/subscribers',
        { params: queryParams }
      );
      return data.data;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch newsletter subscriber statistics
 */
export function useNewsletterStats() {
  return useQuery({
    queryKey: ['admin', 'blog', 'subscribers', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NewsletterSubscriberStats>>(
        '/admin/blog/subscribers/stats'
      );
      return data.data;
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Unsubscribe a user (set isActive = false)
 */
export function useUnsubscribeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriberId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/blog/subscribers/${subscriberId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'subscribers'] });
    },
  });
}

/**
 * Export subscribers as CSV
 */
export function useExportSubscribers() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/admin/blog/subscribers/export', {
        responseType: 'blob',
      });
      // Trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * Manually trigger weekly digest email
 */
export function useSendDigestNow() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ emailsSent: number }>>(
        '/admin/blog/subscribers/send-digest'
      );
      return response.data;
    },
  });
}
