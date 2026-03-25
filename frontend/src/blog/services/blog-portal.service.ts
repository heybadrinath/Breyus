import axios from 'axios';
import type {
  BlogUser,
  BlogSignupPayload,
  BlogLoginPayload,
  BreyusMemberOtpRequestPayload,
  BreyusMemberOtpVerifyPayload,
  BlogAuthResponse,
  BlogComment,
  CreateCommentPayload,
  CommentsResponse,
  LikeStatus,
  ApiResponse,
  BlogSearchParams,
  BlogSearchResponse,
  PublicBlogUser,
  BlogPostWithAccess,
} from '../types';
import type { BlogPost } from '../../types/marketplaceTypes';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Axios instance with credentials for cookie handling
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/**
 * Blog Portal Authentication Service
 */
export const blogAuthService = {
  /**
   * Sign up as a blog-only user
   */
  async signup(payload: BlogSignupPayload): Promise<BlogAuthResponse> {
    const response = await api.post<BlogAuthResponse>('/blog-portal/auth/signup', payload);
    return response.data;
  },

  /**
   * Login as a blog-only user
   */
  async login(payload: BlogLoginPayload): Promise<BlogAuthResponse> {
    const response = await api.post<BlogAuthResponse>('/blog-portal/auth/login', payload);
    return response.data;
  },

  /**
   * Request OTP for Breyus member login
   */
  async requestBreyusOtp(payload: BreyusMemberOtpRequestPayload): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/blog-portal/auth/breyus/request-otp',
      payload
    );
    return response.data;
  },

  /**
   * Verify OTP for Breyus member login
   */
  async verifyBreyusOtp(payload: BreyusMemberOtpVerifyPayload): Promise<BlogAuthResponse> {
    const response = await api.post<BlogAuthResponse>('/blog-portal/auth/breyus/verify-otp', payload);
    return response.data;
  },

  /**
   * Get current authenticated blog user
   */
  async getCurrentUser(): Promise<BlogUser> {
    const response = await api.get<ApiResponse<{ user: BlogUser }>>('/blog-portal/auth/me');
    return response.data.data!.user;
  },

  /**
   * Logout from blog portal
   */
  async logout(): Promise<void> {
    await api.post('/blog-portal/auth/logout');
  },

  /**
   * Request password reset OTP
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/blog-portal/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/blog-portal/auth/reset-password',
      { email, otp, newPassword }
    );
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/blog-portal/auth/change-password',
      { currentPassword, newPassword }
    );
    return response.data;
  },

  /**
   * Check if email is a Breyus member
   */
  async checkEmail(email: string): Promise<{ isBrèyusMember: boolean }> {
    const response = await api.post<ApiResponse<{ isBrèyusMember: boolean }>>(
      '/blog-portal/auth/check-email',
      { email }
    );
    return response.data.data!;
  },

  /**
   * Check for active Breyus session (SSO)
   * Returns profile info if user has active Breyus session
   */
  async checkBreyusSession(): Promise<{
    hasSession: boolean;
    profile?: {
      firstName: string;
      lastName: string;
      email: string;
      companyName: string;
      avatar?: string;
    };
  }> {
    const response = await api.get<ApiResponse<{
      hasSession: boolean;
      profile?: {
        firstName: string;
        lastName: string;
        email: string;
        companyName: string;
        avatar?: string;
      };
    }>>('/blog-portal/auth/check-session');
    return response.data.data!;
  },

  /**
   * SSO Login - Login using active Breyus session
   * User confirms identity via "Yes, that's me" button
   */
  async ssoLogin(): Promise<BlogAuthResponse> {
    const response = await api.post<BlogAuthResponse>('/blog-portal/auth/sso-login');
    return response.data;
  },
};

/**
 * Blog Portal Posts Service
 */
export const blogPostsService = {
  /**
   * Get featured/hero post
   */
  async getFeatured(): Promise<BlogPost | null> {
    const response = await api.get<ApiResponse<{ post: BlogPost }>>('/blog/posts/featured');
    return response.data.data?.post || null;
  },

  /**
   * Get all pinned posts for carousel
   */
  async getPinned(limit: number = 10): Promise<BlogPost[]> {
    const response = await api.get<ApiResponse<{ posts: BlogPost[] }>>('/blog/posts/pinned', {
      params: { limit },
    });
    return response.data.data?.posts || [];
  },

  /**
   * Get available categories with post counts
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const response = await api.get<ApiResponse<{ category: string; count: number }[]>>('/blog/categories');
    return response.data.data || [];
  },

  /**
   * Get trending posts
   */
  async getTrending(limit: number = 6): Promise<BlogPost[]> {
    const response = await api.get<ApiResponse<{ posts: BlogPost[] }>>('/blog/posts/trending', {
      params: { limit },
    });
    return response.data.data?.posts || [];
  },

  /**
   * Search posts
   */
  async search(params: BlogSearchParams): Promise<BlogSearchResponse> {
    const response = await api.get<ApiResponse<BlogSearchResponse>>('/blog/posts/search', {
      params: {
        q: params.query,
        category: params.category,
        tag: params.tag,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data.data!;
  },

  /**
   * Get post by slug (handles member-only access)
   * Returns BlogPostWithAccess which includes accessGranted and accessReason fields
   */
  async getBySlug(slug: string): Promise<BlogPostWithAccess> {
    const response = await api.get<ApiResponse<BlogPostWithAccess>>(`/blog/posts/${slug}`);
    return response.data.data!;
  },

  /**
   * Like a post
   */
  async like(postId: string): Promise<LikeStatus> {
    const response = await api.post<ApiResponse<LikeStatus>>(`/blog-portal/posts/${postId}/like`);
    return response.data.data!;
  },

  /**
   * Unlike a post
   */
  async unlike(postId: string): Promise<LikeStatus> {
    const response = await api.delete<ApiResponse<LikeStatus>>(`/blog-portal/posts/${postId}/like`);
    return response.data.data!;
  },

  /**
   * Get like status for a post
   */
  async getLikeStatus(postId: string): Promise<LikeStatus> {
    const response = await api.get<ApiResponse<LikeStatus>>(`/blog-portal/posts/${postId}/like`);
    return response.data.data!;
  },

  /**
   * Increment share count
   */
  async recordShare(postId: string): Promise<void> {
    await api.post(`/blog-portal/posts/${postId}/share`);
  },

  /**
   * Subscribe to newsletter (public)
   */
  async subscribeNewsletter(email: string, source: string = 'blog_homepage'): Promise<{ message: string }> {
    const response = await api.post<{ statusCode: number; message: string }>('/blog/subscribe', { email, source });
    return { message: response.data.message };
  },

  /**
   * Get newsletter subscription status for an email
   */
  async getNewsletterStatus(email: string): Promise<{ isSubscribed: boolean }> {
    const response = await api.get<ApiResponse<{ isSubscribed: boolean }>>('/blog/newsletter/status', {
      params: { email },
    });
    return response.data.data!;
  },

  /**
   * Toggle newsletter subscription
   */
  async toggleNewsletter(email: string, enabled: boolean): Promise<{ message: string }> {
    const response = await api.post<{ statusCode: number; message: string; data: { enabled: boolean } }>(
      '/blog/newsletter/toggle',
      { email, enabled },
    );
    return { message: response.data.message };
  },
};

/**
 * Blog Portal Comments Service
 */
export const blogCommentsService = {
  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<CommentsResponse> {
    const response = await api.get<ApiResponse<CommentsResponse>>(
      `/blog-portal/comments/post/${postId}`
    );
    return response.data.data!;
  },

  /**
   * Add a comment
   */
  async addComment(postId: string, payload: CreateCommentPayload): Promise<BlogComment> {
    const response = await api.post<ApiResponse<BlogComment>>(
      `/blog-portal/comments/post/${postId}`,
      payload
    );
    return response.data.data!;
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/blog-portal/comments/${commentId}`);
  },

  /**
   * Flag a comment
   */
  async flagComment(commentId: string, reason: string): Promise<void> {
    await api.post(`/blog-portal/comments/${commentId}/flag`, { reason });
  },
};

/**
 * Blog Portal Writers Service
 */
export const blogWritersService = {
  /**
   * Get all active writers with stats
   */
  async getAll(page: number = 1, limit: number = 20, search?: string): Promise<{
    writers: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
      writerBio?: string;
      writerAvatar?: string | null;
      isBrèyusMember: boolean;
      stats: { totalPosts: number; totalViews: number };
      latestPost: { title: string; slug: string } | null;
    }>;
    total: number;
    page: number;
    pages: number;
  }> {
    const response = await api.get<ApiResponse<{
      writers: any[];
      total: number;
      page: number;
      pages: number;
    }>>('/blog-portal/writers', {
      params: { page, limit, search: search || undefined },
    });
    return response.data.data!;
  },

  /**
   * Get public writer profile
   */
  async getProfile(writerId: string): Promise<PublicBlogUser> {
    const response = await api.get<ApiResponse<PublicBlogUser>>(
      `/blog-portal/writers/${writerId}`
    );
    return response.data.data!;
  },

  /**
   * Get writer's published posts
   */
  async getPosts(writerId: string, page: number = 1, limit: number = 10): Promise<{
    posts: BlogPost[];
    total: number;
    pages: number;
  }> {
    const response = await api.get<ApiResponse<{
      posts: BlogPost[];
      total: number;
      pages: number;
    }>>(`/blog-portal/writers/${writerId}/posts`, {
      params: { page, limit },
    });
    return response.data.data!;
  },
};

/**
 * Writer Dashboard Service (for writers managing their own posts)
 */
export const writerDashboardService = {
  /**
   * Get writer's own posts
   */
  async getMyPosts(params?: { status?: string; page?: number; limit?: number }): Promise<{
    posts: BlogPost[];
    total: number;
    pages: number;
  }> {
    const response = await api.get<ApiResponse<{
      posts: BlogPost[];
      total: number;
      pages: number;
    }>>('/blog-portal/writer/posts', { params });
    return response.data.data!;
  },

  /**
   * Get single post for editing
   */
  async getPost(postId: string): Promise<BlogPost> {
    const response = await api.get<ApiResponse<BlogPost>>(`/blog-portal/writer/posts/${postId}`);
    return response.data.data!;
  },

  /**
   * Create new post
   */
  async createPost(payload: {
    title: string;
    tiptapContent?: Record<string, any>;
    excerpt?: string;
    featuredImage?: string;
    categories?: string[];
    tags?: string[];
  }): Promise<BlogPost> {
    const response = await api.post<ApiResponse<BlogPost>>('/blog-portal/writer/posts', payload);
    return response.data.data!;
  },

  /**
   * Update post
   */
  async updatePost(postId: string, payload: Partial<{
    title: string;
    tiptapContent: Record<string, any>;
    excerpt: string;
    featuredImage: string;
    categories: string[];
    tags: string[];
  }>): Promise<BlogPost> {
    const response = await api.patch<ApiResponse<BlogPost>>(
      `/blog-portal/writer/posts/${postId}`,
      payload
    );
    return response.data.data!;
  },

  /**
   * Delete draft post
   */
  async deletePost(postId: string): Promise<void> {
    await api.delete(`/blog-portal/writer/posts/${postId}`);
  },

  /**
   * Submit post for review
   */
  async submitForReview(postId: string): Promise<BlogPost> {
    const response = await api.post<ApiResponse<BlogPost>>(
      `/blog-portal/writer/posts/${postId}/submit`
    );
    return response.data.data!;
  },

  /**
   * Get writer's analytics with trend data
   */
  async getAnalytics(): Promise<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
    growthRate: number;
    viewsTrend: { date: string; count: number }[];
    likesTrend: { date: string; count: number }[];
    topPosts: { title: string; slug: string; views: number; likes: number; comments: number }[];
    recentPosts: BlogPost[];
    postPerformance: {
      title: string;
      slug: string;
      views: number;
      likes: number;
      comments: number;
      publishedAt?: string;
    }[];
    recentComments: {
      _id: string;
      content: string;
      createdAt: string;
      commenterName: string;
      commenterAvatar?: string | null;
      postTitle: string;
      postSlug: string;
    }[];
  }> {
    const response = await api.get<ApiResponse<{
      totalPosts: number;
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      engagementRate: number;
      growthRate: number;
      viewsTrend: { date: string; count: number }[];
      likesTrend: { date: string; count: number }[];
      topPosts: { title: string; slug: string; views: number; likes: number; comments: number }[];
      recentPosts: BlogPost[];
      postPerformance: {
        title: string;
        slug: string;
        views: number;
        likes: number;
        comments: number;
        publishedAt?: string;
      }[];
      recentComments: {
        _id: string;
        content: string;
        createdAt: string;
        commenterName: string;
        commenterAvatar?: string | null;
        postTitle: string;
        postSlug: string;
      }[];
    }>>('/blog-portal/writer/analytics');
    return response.data.data!;
  },

  /**
   * Upload image for blog content
   */
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<{ url: string; filename: string }>>(
      '/blog-portal/writer/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  /**
   * Update writer profile (avatar, banner, bio)
   * Note: Pass null to clear avatar/banner fields
   */
  async updateProfile(updates: {
    writerAvatar?: string | null;
    writerBanner?: string | null;
    writerBio?: string;
  }): Promise<{ writerAvatar: string | null; writerBanner: string | null; writerBio: string }> {
    const response = await api.patch<ApiResponse<{
      writerAvatar: string | null;
      writerBanner: string | null;
      writerBio: string;
    }>>('/blog-portal/writer/profile', updates);
    return response.data.data!;
  },
};

/**
 * Writer Invite Service
 */
export const writerInviteService = {
  /**
   * Validate writer invite token
   */
  async validate(token: string): Promise<{
    valid: boolean;
    expired?: boolean;
    used?: boolean;
    message?: string;
    emailHint?: string;
    expiresAt?: string;
  }> {
    try {
      const response = await api.get<ApiResponse<{
        valid: boolean;
        expired?: boolean;
        used?: boolean;
        message?: string;
        emailHint?: string;
        expiresAt?: string;
      }>>(`/blog-portal/invite/${token}/validate`);
      return response.data.data!;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid invite';
      return { valid: false, message };
    }
  },

  /**
   * Claim writer invite (requires authentication)
   */
  async claim(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/blog-portal/invite/${token}/claim`
    );
    return response.data.data!;
  },
};

/**
 * Unified Blog Portal Service
 * Provides a single object with all service methods for convenience
 */
export const blogPortalService = {
  // Auth
  signup: blogAuthService.signup,
  login: blogAuthService.login,
  requestBreyusOtp: blogAuthService.requestBreyusOtp,
  verifyBreyusOtp: blogAuthService.verifyBreyusOtp,
  getCurrentUser: blogAuthService.getCurrentUser,
  logout: blogAuthService.logout,
  forgotPassword: blogAuthService.forgotPassword,
  resetPassword: blogAuthService.resetPassword,
  changePassword: blogAuthService.changePassword,
  checkEmail: blogAuthService.checkEmail,
  checkBreyusSession: blogAuthService.checkBreyusSession,
  ssoLogin: blogAuthService.ssoLogin,

  // Posts
  getFeaturedPost: blogPostsService.getFeatured,
  getTrendingPosts: blogPostsService.getTrending,
  searchPosts: blogPostsService.search,
  getCategories: blogPostsService.getCategories,
  getPostBySlug: blogPostsService.getBySlug,
  likePost: blogPostsService.like,
  unlikePost: blogPostsService.unlike,
  getLikeStatus: blogPostsService.getLikeStatus,
  recordShare: blogPostsService.recordShare,
  subscribeNewsletter: blogPostsService.subscribeNewsletter,
  getNewsletterStatus: blogPostsService.getNewsletterStatus,
  toggleNewsletter: blogPostsService.toggleNewsletter,

  // Comments
  getComments: blogCommentsService.getComments,
  addComment: blogCommentsService.addComment,
  deleteComment: blogCommentsService.deleteComment,
  flagComment: blogCommentsService.flagComment,

  // Writers (public profiles)
  getAllWriters: blogWritersService.getAll,
  getWriterProfile: blogWritersService.getProfile,
  getWriterPosts: async () => {
    const result = await writerDashboardService.getMyPosts();
    return result.posts;
  },

  // Writer Dashboard
  getWriterPost: writerDashboardService.getPost,
  createWriterPost: writerDashboardService.createPost,
  updateWriterPost: writerDashboardService.updatePost,
  deleteWriterPost: writerDashboardService.deletePost,
  submitPostForReview: writerDashboardService.submitForReview,
  getWriterAnalytics: writerDashboardService.getAnalytics,
  uploadImage: writerDashboardService.uploadImage,

  // Writer Invites
  validateInvite: writerInviteService.validate,
  claimWriterInvite: writerInviteService.claim,
};

export default {
  auth: blogAuthService,
  posts: blogPostsService,
  comments: blogCommentsService,
  writers: blogWritersService,
  writerDashboard: writerDashboardService,
  invite: writerInviteService,
  blogPortalService,
};
