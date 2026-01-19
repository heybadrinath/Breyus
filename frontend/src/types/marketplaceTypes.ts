/**
 * Marketplace Types
 * Types for blog posts and commodity prices displayed on the marketplace page
 */

// Blog Post Types
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
  readTimeMinutes: number;
  viewCount: number;
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

export interface CommodityPrice {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  exchange: Exchange;
  category: CommodityCategory;
  unit: string;
  fetchedAt: string;
  delayMinutes: number;
  isActive: boolean;
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
