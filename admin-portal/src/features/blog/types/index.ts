/**
 * Blog Post Types for Admin Portal
 * Updated for Tiptap editor and editorial workflow
 */

// ─────────────────────────────────────────────────────────────
// Tiptap Content Types
// ─────────────────────────────────────────────────────────────

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, any>;
}

export interface TiptapContent {
  type: 'doc';
  content: TiptapNode[];
}

// ─────────────────────────────────────────────────────────────
// Blog Status and Access Types
// ─────────────────────────────────────────────────────────────

export type BlogStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'published'
  | 'rejected';

export type BlogAccessLevel = 'public' | 'member_only';

// ─────────────────────────────────────────────────────────────
// Blog Post Entity
// ─────────────────────────────────────────────────────────────

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  tiptapContent: TiptapContent;
  excerpt: string;
  featuredImage?: string;

  // Author info
  author: {
    _id: string;
    email: string;
    name?: string;
  };

  // Writer attribution (for external writers)
  writerId?: string;
  writerDisplayName?: string;
  writerBio?: string;
  writerAvatar?: string;

  // Status and access
  status: BlogStatus;
  accessLevel: BlogAccessLevel;

  // Editorial workflow
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;

  // Feature flags
  isFeatured: boolean;
  isPinned: boolean;

  // Metadata
  publishedAt?: string;
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Stats
  readTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// List item (without full content for performance)
export interface BlogPostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    _id: string;
    email: string;
    name?: string;
  };
  writerId?: string;
  writerDisplayName?: string;
  status: BlogStatus;
  accessLevel: BlogAccessLevel;
  isFeatured: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  publishedAt?: string;
  submittedAt?: string;
  categories: string[];
  tags: string[];
  readTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────

export interface CreateBlogPostDto {
  title: string;
  slug?: string;
  tiptapContent?: TiptapContent;
  excerpt?: string;
  featuredImage?: string;
  status?: BlogStatus;
  accessLevel?: BlogAccessLevel;
  categories?: string[];
  tags?: string[];
  hsnCodePrefixes?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateBlogPostDto {
  title?: string;
  slug?: string;
  tiptapContent?: TiptapContent;
  excerpt?: string;
  featuredImage?: string;
  status?: BlogStatus;
  accessLevel?: BlogAccessLevel;
  categories?: string[];
  tags?: string[];
  hsnCodePrefixes?: string[];
  metaTitle?: string;
  metaDescription?: string;
  isFeatured?: boolean;
  isPinned?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Query and Response Types
// ─────────────────────────────────────────────────────────────

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus;
  accessLevel?: BlogAccessLevel;
  category?: string;
  authorId?: string;
  writerId?: string;
  includeDeleted?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogPostsResponse {
  posts: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  submitted: number;
  inReview: number;
  approved: number;
  rejected: number;
  deleted: number;
  memberOnly: number;
  pinned: number;
  topCategories: Array<{ category: string; count: number }>;
  recentPosts: Array<{
    _id: string;
    title: string;
    status: BlogStatus;
    publishedAt?: string;
    createdAt: string;
    viewCount: number;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Image Upload
// ─────────────────────────────────────────────────────────────

export interface ImageUploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

// ─────────────────────────────────────────────────────────────
// Form Data
// ─────────────────────────────────────────────────────────────

export interface BlogFormData {
  title: string;
  slug: string;
  tiptapContent: TiptapContent;
  excerpt: string;
  featuredImage: string;
  accessLevel: BlogAccessLevel;
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];
  metaTitle: string;
  metaDescription: string;
}

export const defaultTiptapContent: TiptapContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export const defaultBlogFormData: BlogFormData = {
  title: '',
  slug: '',
  tiptapContent: defaultTiptapContent,
  excerpt: '',
  featuredImage: '',
  accessLevel: 'public',
  categories: [],
  tags: [],
  hsnCodePrefixes: [],
  metaTitle: '',
  metaDescription: '',
};

// ─────────────────────────────────────────────────────────────
// Writer Types
// ─────────────────────────────────────────────────────────────

export interface BlogWriter {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  isBrèyusMember: boolean;
  isWriter: boolean;
  writerBio?: string;
  writerAvatar?: string;
  writerApprovedAt?: string;
  createdAt: string;
  postCount: number;
  totalViews: number;
}

export interface WriterInvite {
  _id: string;
  token: string;
  createdBy: {
    _id: string;
    email: string;
  };
  usedBy?: {
    _id: string;
    email: string;
  };
  usedAt?: string;
  expiresAt: string;
  emailHint?: string;
  adminNote?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Newsletter Subscriber Types
// ─────────────────────────────────────────────────────────────

export type SubscriberSource = 'blog_footer' | 'blog_homepage' | 'blog_post';

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  unsubscribeToken: string;
  source: SubscriberSource;
  lastDigestSentAt?: string;
}

export interface NewsletterSubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  newThisWeek: number;
  growthRate: number;
  sourceBreakdown: Array<{ source: SubscriberSource; count: number }>;
}

export interface NewsletterSubscribersResponse {
  subscribers: NewsletterSubscriber[];
  total: number;
  page: number;
  pages: number;
}

export interface NewsletterSubscriberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  source?: SubscriberSource;
  sortBy?: 'subscribedAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────
// Status Helpers
// ─────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BlogStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<BlogStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20' },
  submitted: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  in_review: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20' },
  revision_requested: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20' },
  approved: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20' },
  published: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
};
