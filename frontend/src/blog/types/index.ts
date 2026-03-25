/**
 * Blog Portal Types
 * Types for the blog portal feature including authentication, users, and comments
 */

import { BlogPost, BlogAccessLevel, TiptapContent } from '../../types/marketplaceTypes';

// ─────────────────────────────────────────────────────────────
// Blog User Types
// ─────────────────────────────────────────────────────────────

/**
 * Blog portal user (separate from Breyus user)
 */
export interface BlogUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  website?: string;
  areaOfInterest: string;
  experience: string;
  areaOfExpertise: string;

  // Breyus integration
  breyusUserId?: string;
  isBrèyusMember: boolean;

  // Writer status
  isWriter: boolean;
  writerBio: string;
  writerAvatar?: string;
  writerBanner?: string;
  writerApprovedAt?: string;

  // Metadata
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Blog user for public display (limited fields)
 */
export interface PublicBlogUser {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  isBrèyusMember: boolean;
  isWriter: boolean;
  writerBio?: string;
  writerAvatar?: string;
  writerBanner?: string;
}

// ─────────────────────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────────────────────

/**
 * Blog portal signup payload
 */
export interface BlogSignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  website?: string;
  areaOfInterest?: string;
  experience?: string;
  areaOfExpertise?: string;
}

/**
 * Blog portal login payload
 */
export interface BlogLoginPayload {
  email: string;
  password: string;
}

/**
 * Breyus member OTP request payload
 */
export interface BreyusMemberOtpRequestPayload {
  email: string;
}

/**
 * Breyus member OTP verification payload
 */
export interface BreyusMemberOtpVerifyPayload {
  email: string;
  otp: string;
}

/**
 * Auth response from login/signup
 */
export interface BlogAuthResponse {
  statusCode: number;
  message: string;
  data: {
    user: BlogUser;
    isNewUser?: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// Comment Types
// ─────────────────────────────────────────────────────────────

/**
 * Blog comment
 */
export interface BlogComment {
  _id: string;
  blogPostId: string;
  blogUserId: string;
  user: PublicBlogUser;
  content: string;
  parentId?: string;

  // Moderation
  isFlagged: boolean;
  flagCount: number;
  isHidden: boolean;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Nested replies (populated on fetch)
  replies?: BlogComment[];
}

/**
 * Create comment payload
 */
export interface CreateCommentPayload {
  content: string;
  parentId?: string;
}

/**
 * Comments response
 */
export interface CommentsResponse {
  comments: BlogComment[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Like Types
// ─────────────────────────────────────────────────────────────

/**
 * Like status for a post
 */
export interface LikeStatus {
  isLiked: boolean;
  likeCount: number;
}

// ─────────────────────────────────────────────────────────────
// Writer Types
// ─────────────────────────────────────────────────────────────

/**
 * Writer invite
 */
export interface WriterInvite {
  _id: string;
  token: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
  expiresAt: string;
  emailHint?: string;
  adminNote?: string;
  createdAt: string;
}

/**
 * Create post payload for writers
 */
export interface CreateWriterPostPayload {
  title: string;
  slug?: string;
  tiptapContent?: TiptapContent;
  excerpt?: string;
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Update post payload for writers
 */
export interface UpdateWriterPostPayload extends Partial<CreateWriterPostPayload> {}

/**
 * Writer post status
 */
export interface WriterPostStatus {
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
  statusMessage: string;
}

// ─────────────────────────────────────────────────────────────
// Homepage Types
// ─────────────────────────────────────────────────────────────

/**
 * Featured/hero post
 */
export interface FeaturedPost {
  post: BlogPost;
}

/**
 * Trending posts response
 */
export interface TrendingPostsResponse {
  posts: BlogPost[];
}

/**
 * Category with post count
 */
export interface CategoryWithCount {
  category: string;
  count: number;
}

/**
 * Writer spotlight data
 */
export interface WriterSpotlightData {
  writer: PublicBlogUser;
  recentPosts: BlogPost[];
  totalPosts: number;
}

// ─────────────────────────────────────────────────────────────
// Search Types
// ─────────────────────────────────────────────────────────────

/**
 * Search query parameters
 */
export interface BlogSearchParams {
  query: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

/**
 * Search results response
 */
export interface BlogSearchResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Re-export commonly used types from marketplaceTypes
export type { BlogPost, BlogAccessLevel, BlogStatus, TiptapContent } from '../../types/marketplaceTypes';

// Import for use in interface extension
import type { BlogPost as BlogPostBase } from '../../types/marketplaceTypes';

// ─────────────────────────────────────────────────────────────
// Access Control Types
// ─────────────────────────────────────────────────────────────

/**
 * Access reason for restricted content
 */
export type AccessReason = 'sign_in_required' | 'membership_required' | null;

/**
 * Blog post response with access control info
 * Used when fetching a single post that may have restricted access
 */
export interface BlogPostWithAccess extends BlogPostBase {
  accessGranted: boolean;
  accessReason: AccessReason;
}

// ─────────────────────────────────────────────────────────────
// Blog Form Data
// ─────────────────────────────────────────────────────────────

/**
 * Form data for creating/editing blog posts
 */
export interface BlogFormData {
  title: string;
  slug: string;
  tiptapContent: import('../../types/marketplaceTypes').TiptapContent;
  excerpt: string;
  featuredImage: string;
  accessLevel: import('../../types/marketplaceTypes').BlogAccessLevel;
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];
  metaTitle: string;
  metaDescription: string;
}

// ─────────────────────────────────────────────────────────────
// Blog Post List Item (for listings without full content)
// ─────────────────────────────────────────────────────────────

/**
 * Simplified blog post for list views
 */
export interface BlogPostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  status: import('../../types/marketplaceTypes').BlogStatus;
  accessLevel: import('../../types/marketplaceTypes').BlogAccessLevel;
  categories: string[];
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Editorial workflow fields
  rejectionReason?: string;
  revisionNotes?: string;
  submittedAt?: string;
}
