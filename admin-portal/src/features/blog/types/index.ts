/**
 * Blog Post Types for Admin Portal
 */

// Block content types for Notion-style editor
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'image'
  | 'quote'
  | 'divider'
  | 'code';

export interface BlockContent {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    alt?: string;
    caption?: string;
    language?: string;
    items?: string[];
  };
}

export type BlogStatus = 'draft' | 'published';

// Main blog post entity
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: BlockContent[];
  excerpt: string;
  featuredImage?: string;
  author: {
    _id: string;
    email: string;
    name?: string;
  };
  status: BlogStatus;
  publishedAt?: string;
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];
  readTimeMinutes: number;
  viewCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// List response (without full content)
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
  status: BlogStatus;
  publishedAt?: string;
  categories: string[];
  tags: string[];
  readTimeMinutes: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Create DTO
export interface CreateBlogPostDto {
  title: string;
  slug?: string;
  content: BlockContent[];
  excerpt?: string;
  featuredImage?: string;
  status?: BlogStatus;
  categories?: string[];
  tags?: string[];
  hsnCodePrefixes?: string[];
  readTimeMinutes?: number;
}

// Update DTO
export interface UpdateBlogPostDto {
  title?: string;
  slug?: string;
  content?: BlockContent[];
  excerpt?: string;
  featuredImage?: string;
  status?: BlogStatus;
  categories?: string[];
  tags?: string[];
  hsnCodePrefixes?: string[];
  readTimeMinutes?: number;
}

// Query parameters
export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus;
  category?: string;
  authorId?: string;
  includeDeleted?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface BlogPostsResponse {
  posts: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Blog statistics
export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  deleted: number;
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

// Image upload response
export interface ImageUploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

// Form data for editor
export interface BlogFormData {
  title: string;
  slug: string;
  content: BlockContent[];
  excerpt: string;
  featuredImage: string;
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];
}

// Default form data
export const defaultBlogFormData: BlogFormData = {
  title: '',
  slug: '',
  content: [{ id: '1', type: 'paragraph', content: '' }],
  excerpt: '',
  featuredImage: '',
  categories: [],
  tags: [],
  hsnCodePrefixes: [],
};
