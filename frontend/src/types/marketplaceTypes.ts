/**
 * Marketplace Types
 * Types for blog posts and commodity prices displayed on the marketplace page
 */

// Blog Post Types

/**
 * Blog post access levels
 * - public: Anyone can read
 * - member_only: Only Breyus members can access
 */
export type BlogAccessLevel = 'public' | 'member_only';

/**
 * Blog post status with full editorial workflow
 */
export type BlogStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'published'
  | 'rejected';

/**
 * Content format - only Tiptap is supported
 */
export type ContentFormat = 'tiptap';

/**
 * Tiptap JSON document structure
 */
export interface TiptapContent {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: TiptapMark[];
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

/**
 * Blog author (admin user)
 */
export interface BlogAuthor {
  _id: string;
  email: string;
  name?: string;
}

/**
 * Blog writer (external writer from blog_users)
 */
export interface BlogWriter {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  writerBio?: string;
  writerAvatar?: string;
}

/**
 * Blog Post entity
 */
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;

  // Content
  contentFormat: ContentFormat;
  tiptapContent?: TiptapContent;

  // Attribution
  author?: BlogAuthor;
  writerId?: BlogWriter;
  writerDisplayName: string;
  writerBio: string;
  writerAvatar?: string;

  // Status and workflow
  status: BlogStatus;
  publishedAt?: string;
  accessLevel: BlogAccessLevel;

  // Editorial workflow
  submittedAt?: string;
  reviewedBy?: BlogAuthor;
  reviewedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;

  // Categorization
  categories: string[];
  tags: string[];
  hsnCodePrefixes?: string[];

  // Engagement metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  uniqueViewCount: number;

  // Reading metadata
  readTimeMinutes: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Featured/pinned
  isFeatured: boolean;
  isPinned: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
  isPersonalized?: boolean;
}

export interface BlogCategory {
  category: string;
  count: number;
}

export interface BlogTag {
  tag: string;
  count: number;
}

// Commodity Price Types
export type CommodityCategory = 'Energy' | 'Metals' | 'Agricultural' | 'Precious Metals';

export type Exchange = 'CME' | 'NYMEX' | 'LME' | 'COMEX' | 'CBOT' | 'ICE' | 'MCX' | 'OTHER';

/**
 * Historical price data point for sparklines and charts
 */
export interface PriceHistoryPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
}

export interface CommodityPrice {
  _id: string;
  symbol: string;
  name: string;
  price: number | null;
  currency: string;
  change: number | null;
  changePercent: number | null;
  exchange: Exchange;
  category: CommodityCategory;
  unit: string;
  fetchedAt: string;
  delayMinutes: number;
  isActive: boolean;
  // Historical data for sparklines and charts
  priceHistory?: PriceHistoryPoint[]; // Last 7 days for sparkline
  weekHigh?: number; // 7-day high
  weekLow?: number; // 7-day low
}

export interface CommodityPriceSummary {
  prices: CommodityPrice[];
  lastUpdated: string | null;
  delayMinutes: number;
  totalCount: number;
  nextRefreshAt: string | null;      // When the next refresh will occur
  refreshIntervalHours: number;       // How often data refreshes (12 hours)
  dataSource: string;                 // "Alpha Vantage" or "Unavailable"
  isLoading: boolean;                 // Whether a refresh is in progress
}
