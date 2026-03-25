import {
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { BlogPost } from './schemas/blog-post.schema';
import {
  PublicBlogQueryDto,
  PersonalizedBlogQueryDto,
} from './dto/blog-query.dto';
import { AuthService } from '../auth/auth.service';
import { BlogSession } from '../blog-portal/schemas/blog-session.schema';
import { BlogUser } from '../blog-portal/schemas/blog-user.schema';
import { Trade } from '../trade/schema/trade.schema';
import { Wishlist } from '../wishlist/wishlist.schema';

/**
 * Tiptap JSON document structure (simplified)
 * Full structure: { type: 'doc', content: [{ type: 'paragraph', content: [...] }, ...] }
 */
interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, any>;
}

/**
 * Interface for extracted user interests from various sources
 * Used by the personalization algorithm to match blog posts
 */
interface ExtractedInterests {
  categories: string[];
  tags: string[];
  hsnPrefixes: string[];
}

/**
 * Tracks which data sources contributed to personalization
 * Returned to frontend for tip message logic
 */
interface InterestSources {
  hasOwnProducts: boolean;
  hasWishlistProducts: boolean;
  hasAiContacts: boolean;
  hasTrades: boolean;
}

/**
 * BlogService handles public-facing blog operations
 * - Listing published posts with pagination
 * - Interest-based personalization using user's product data
 * - View count tracking
 * - Category and tag aggregations
 *
 * Updated to support Tiptap content format
 */
@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel(BlogSession.name)
    private readonly blogSessionModel: Model<BlogSession>,
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
    @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<Wishlist>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Maximum slug length for URL friendliness
   * Keeps URLs manageable and SEO-friendly
   */
  private static readonly MAX_SLUG_LENGTH = 100;

  /**
   * Helper: Generate URL-friendly slug from title
   *
   * - Converts to lowercase
   * - Removes special characters
   * - Replaces spaces with hyphens
   * - Truncates to MAX_SLUG_LENGTH characters
   * - Ensures slug doesn't end mid-word
   */
  static generateSlug(title: string): string {
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from ends

    // Truncate if too long, but don't cut mid-word
    if (slug.length > BlogService.MAX_SLUG_LENGTH) {
      slug = slug.slice(0, BlogService.MAX_SLUG_LENGTH);
      // Find last hyphen to avoid cutting mid-word
      const lastHyphen = slug.lastIndexOf('-');
      if (lastHyphen > BlogService.MAX_SLUG_LENGTH / 2) {
        slug = slug.slice(0, lastHyphen);
      }
      // Clean up any trailing hyphens
      slug = slug.replace(/-+$/g, '');
    }

    return slug;
  }

  /**
   * Helper: Extract plain text from Tiptap JSON document
   */
  static extractTextFromTiptap(node: TiptapNode | null): string {
    if (!node) return '';

    let text = '';

    if (node.text) {
      text += node.text;
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        text += BlogService.extractTextFromTiptap(child) + ' ';
      }
    }

    return text.trim();
  }

  /**
   * Helper: Calculate read time based on Tiptap content
   * Average reading speed: 200-250 words per minute
   */
  static calculateReadTime(tiptapContent: Record<string, any> | null): number {
    if (!tiptapContent) return 1;

    const text = BlogService.extractTextFromTiptap(tiptapContent as TiptapNode);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Minimum 1 minute, round up
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Helper: Generate excerpt from Tiptap content
   */
  static generateExcerpt(
    tiptapContent: Record<string, any> | null,
    maxLength: number = 160,
  ): string {
    if (!tiptapContent) return '';

    const text = BlogService.extractTextFromTiptap(tiptapContent as TiptapNode);
    const trimmed = text.replace(/\s+/g, ' ').trim();

    if (trimmed.length <= maxLength) {
      return trimmed;
    }

    return trimmed.substring(0, maxLength).trim() + '...';
  }

  /**
   * Get published blog posts with pagination and filters
   * Public endpoint - no authentication required
   */
  async getPublishedPosts(query: PublicBlogQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      tag,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {
      status: 'published',
      isDeleted: false,
    };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      // Case-insensitive category match - supports both slugs (market-analysis) and display names (Market Analysis)
      filter.categories = {
        $regex: new RegExp(`^${category.replace(/-/g, '[- ]?')}$`, 'i'),
      };
    }

    if (tag) {
      // Case-insensitive tag match
      filter.tags = { $regex: new RegExp(`^${tag}$`, 'i') };
    }

    // Build sort options
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-tiptapContent -isDeleted -deletedAt') // Exclude full content for list view
        .populate('author', 'email name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogPostModel.countDocuments(filter),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Validate blog session token and return user if valid
   * Returns null if no token or invalid session (doesn't throw)
   */
  private async validateBlogSession(
    sessionToken: string | null,
  ): Promise<BlogUser | null> {
    if (!sessionToken) {
      return null;
    }

    try {
      // Hash the token to compare with stored hash
      const tokenHash = crypto
        .createHash('sha256')
        .update(sessionToken)
        .digest('hex');

      // Find valid session
      const session = await this.blogSessionModel.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return null;
      }

      // Get the blog user
      const blogUser = await this.blogUserModel.findById(session.blogUserId);
      return blogUser || null;
    } catch {
      return null;
    }
  }

  /**
   * Generate a preview excerpt from Tiptap content (first ~300 chars)
   * Used for blurred preview of member-only content
   */
  private generatePreviewContent(
    tiptapContent: Record<string, any> | null,
  ): Record<string, any> | null {
    if (!tiptapContent || !tiptapContent.content) {
      return null;
    }

    // Take only first 2-3 paragraphs for preview
    const previewNodes = tiptapContent.content.slice(0, 3);

    return {
      type: 'doc',
      content: previewNodes,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONALIZATION INTEREST EXTRACTION METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  // These methods extract user interests from 4 sources for blog personalization:
  // 1. User's own products (sellers)
  // 2. Wishlist products (items saved for later)
  // 3. AI contacts (saved from AI search results)
  // 4. Trade history (products bought/sold)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Extract interests from user's own products (for sellers)
   * Signal strength: High (2x) - represents their core business focus
   */
  private async extractProductInterests(
    userId: string,
  ): Promise<ExtractedInterests> {
    try {
      const userProducts = await this.productModel
        .find({ userId: new Types.ObjectId(userId) })
        .select('category tags hsnCode')
        .lean();

      if (!userProducts || userProducts.length === 0) {
        return { categories: [], tags: [], hsnPrefixes: [] };
      }

      return {
        categories: userProducts
          .map((p: any) => p.category)
          .filter(Boolean)
          .map((c: string) => c.toLowerCase()),
        tags: userProducts
          .flatMap((p: any) => p.tags || [])
          .filter(Boolean)
          .map((t: string) => t.toLowerCase()),
        hsnPrefixes: userProducts
          .map((p: any) => p.hsnCode?.substring(0, 2))
          .filter(Boolean),
      };
    } catch (error) {
      console.error('Error extracting product interests:', error.message);
      return { categories: [], tags: [], hsnPrefixes: [] };
    }
  }

  /**
   * Extract interests from wishlist products
   * Signal strength: Medium (1.5x) - saved for later = active interest
   */
  private async extractWishlistInterests(
    userId: string,
  ): Promise<ExtractedInterests> {
    try {
      const wishlistItems = await this.wishlistModel
        .find({
          user: new Types.ObjectId(userId),
          sourceType: 'product',
          product: { $exists: true },
        })
        .populate({
          path: 'product',
          select: 'category tags hsnCode',
        })
        .lean();

      if (!wishlistItems || wishlistItems.length === 0) {
        return { categories: [], tags: [], hsnPrefixes: [] };
      }

      // Filter out deleted products (where populate returns null)
      const validProducts = wishlistItems
        .map((w: any) => w.product)
        .filter((p: any) => p && typeof p === 'object');

      return {
        categories: validProducts
          .map((p: any) => p.category)
          .filter(Boolean)
          .map((c: string) => c.toLowerCase()),
        tags: validProducts
          .flatMap((p: any) => p.tags || [])
          .filter(Boolean)
          .map((t: string) => t.toLowerCase()),
        hsnPrefixes: validProducts
          .map((p: any) => p.hsnCode?.substring(0, 2))
          .filter(Boolean),
      };
    } catch (error) {
      console.error('Error extracting wishlist interests:', error.message);
      return { categories: [], tags: [], hsnPrefixes: [] };
    }
  }

  /**
   * Extract interests from saved AI contacts
   * Signal strength: Low (1x) - exploration/research phase
   *
   * Uses savedCommodity as category-like signal
   * Uses savedHsCode prefix for HSN matching
   */
  private async extractAiContactInterests(
    userId: string,
  ): Promise<ExtractedInterests> {
    try {
      const aiContacts = await this.wishlistModel
        .find({
          user: new Types.ObjectId(userId),
          sourceType: 'ai_contact',
        })
        .select('savedCommodity savedHsCode')
        .lean();

      if (!aiContacts || aiContacts.length === 0) {
        return { categories: [], tags: [], hsnPrefixes: [] };
      }

      // Commodities serve as category-like signals
      const commodities = aiContacts
        .map((c: any) => c.savedCommodity)
        .filter(Boolean)
        .map((c: string) => c.toLowerCase());

      // HSN codes give chapter-level matching
      const hsnPrefixes = aiContacts
        .map((c: any) => c.savedHsCode?.substring(0, 2))
        .filter(Boolean);

      return {
        categories: commodities, // Commodity names act as categories
        tags: commodities, // Also use as tags for broader matching
        hsnPrefixes,
      };
    } catch (error) {
      console.error('Error extracting AI contact interests:', error.message);
      return { categories: [], tags: [], hsnPrefixes: [] };
    }
  }

  /**
   * Extract interests from trade history
   * Signal strength: Highest (3x) - actual business transactions
   *
   * Only considers meaningful trade phases (beyond initial PR)
   * Includes both buyer and seller perspective
   */
  private async extractTradeInterests(
    userId: string,
  ): Promise<ExtractedInterests> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      // Get trades where user is buyer OR seller
      // Only include meaningful phases (beyond PR negotiation)
      const trades = await this.tradeModel
        .find({
          $or: [{ buyer: userObjectId }, { seller: userObjectId }],
          tradePhase: {
            $in: ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'],
          },
        })
        .populate({
          path: 'product',
          select: 'category tags hsnCode',
        })
        .select('product')
        .lean();

      if (!trades || trades.length === 0) {
        return { categories: [], tags: [], hsnPrefixes: [] };
      }

      // Filter out trades with deleted products
      const validProducts = trades
        .map((t: any) => t.product)
        .filter((p: any) => p && typeof p === 'object');

      return {
        categories: validProducts
          .map((p: any) => p.category)
          .filter(Boolean)
          .map((c: string) => c.toLowerCase()),
        tags: validProducts
          .flatMap((p: any) => p.tags || [])
          .filter(Boolean)
          .map((t: string) => t.toLowerCase()),
        hsnPrefixes: validProducts
          .map((p: any) => p.hsnCode?.substring(0, 2))
          .filter(Boolean),
      };
    } catch (error) {
      console.error('Error extracting trade interests:', error.message);
      return { categories: [], tags: [], hsnPrefixes: [] };
    }
  }

  /**
   * Combine interests from multiple sources with weighted scoring
   *
   * Weighting strategy:
   * - Trade history: 3x (highest - actual business)
   * - Own products: 2x (high - core business focus)
   * - Wishlist products: 1.5x (medium - active interest)
   * - AI contacts: 1x (low - exploration)
   *
   * Returns deduplicated, frequency-weighted arrays capped at reasonable sizes
   */
  private combineInterests(
    tradeInterests: ExtractedInterests,
    productInterests: ExtractedInterests,
    wishlistInterests: ExtractedInterests,
    aiContactInterests: ExtractedInterests,
  ): ExtractedInterests {
    // Helper to count weighted frequency
    const countFrequency = (
      items: string[],
      weight: number,
      frequencyMap: Map<string, number>,
    ) => {
      items.forEach((item) => {
        const normalized = item.toLowerCase();
        frequencyMap.set(
          normalized,
          (frequencyMap.get(normalized) || 0) + weight,
        );
      });
    };

    // Categories with weighting
    const categoryFreq = new Map<string, number>();
    countFrequency(tradeInterests.categories, 3, categoryFreq);
    countFrequency(productInterests.categories, 2, categoryFreq);
    countFrequency(wishlistInterests.categories, 1.5, categoryFreq);
    countFrequency(aiContactInterests.categories, 1, categoryFreq);

    // Tags with weighting
    const tagFreq = new Map<string, number>();
    countFrequency(tradeInterests.tags, 3, tagFreq);
    countFrequency(productInterests.tags, 2, tagFreq);
    countFrequency(wishlistInterests.tags, 1.5, tagFreq);
    countFrequency(aiContactInterests.tags, 1, tagFreq);

    // HSN prefixes with weighting
    const hsnFreq = new Map<string, number>();
    countFrequency(tradeInterests.hsnPrefixes, 3, hsnFreq);
    countFrequency(productInterests.hsnPrefixes, 2, hsnFreq);
    countFrequency(wishlistInterests.hsnPrefixes, 1.5, hsnFreq);
    countFrequency(aiContactInterests.hsnPrefixes, 1, hsnFreq);

    // Sort by frequency and take top items
    const sortByFrequency = (freqMap: Map<string, number>, limit: number) =>
      Array.from(freqMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([item]) => item);

    return {
      categories: sortByFrequency(categoryFreq, 20), // Cap at 20 categories
      tags: sortByFrequency(tagFreq, 50), // Cap at 50 tags
      hsnPrefixes: sortByFrequency(hsnFreq, 20), // Cap at 20 HSN prefixes
    };
  }

  /**
   * Get single blog post by slug
   * Increments view count on each fetch
   *
   * Access Control (Medium-style):
   * - Public posts: Full content returned
   * - Member-only posts without access: Returns partial content + accessGranted: false
   *   (Frontend shows blurred content with sign-in overlay)
   * - Member-only posts with access: Full content returned
   */
  async getPostBySlug(slug: string, sessionToken?: string | null) {
    // Fetch the post
    const post = await this.blogPostModel
      .findOne({ slug, status: 'published', isDeleted: false })
      .populate('author', 'email name')
      .lean();

    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    // Default: full access
    let accessGranted = true;
    let accessReason: string | null = null;

    // Check if member-only content
    if (post.accessLevel === 'member_only') {
      const blogUser = await this.validateBlogSession(sessionToken || null);

      if (!blogUser) {
        // Not authenticated
        accessGranted = false;
        accessReason = 'sign_in_required';
      } else if (!blogUser.isBrèyusMember) {
        // Authenticated but not a Breyus member
        accessGranted = false;
        accessReason = 'membership_required';
      }
    }

    // Increment view count regardless of access
    await this.blogPostModel.updateOne(
      { _id: post._id },
      { $inc: { viewCount: 1 } },
    );

    // If access denied, return partial content for blur preview
    if (!accessGranted) {
      return {
        ...post,
        viewCount: (post.viewCount || 0) + 1,
        // Replace full content with preview (first few paragraphs)
        tiptapContent: this.generatePreviewContent(post.tiptapContent),
        // Access control flags for frontend
        accessGranted: false,
        accessReason,
      };
    }

    // Full access - return everything
    return {
      ...post,
      viewCount: (post.viewCount || 0) + 1,
      accessGranted: true,
      accessReason: null,
    };
  }

  /**
   * Get personalized blog posts based on user's interests from multiple sources
   *
   * Interest sources (in order of signal strength):
   * 1. Trade history (3x) - Products bought/sold = actual business intent
   * 2. Own products (2x) - Seller's inventory = core business focus
   * 3. Wishlist products (1.5x) - Saved for later = active interest
   * 4. AI contacts (1x) - Saved commodities from AI search = exploration
   *
   * Scoring algorithm:
   * - Category match: 3 points (normalized to lowercase)
   * - Tag match: 2 points (normalized to lowercase)
   * - HSN prefix match: 2 points (chapter-level HSN codes)
   *
   * Falls back to recent posts if no interests can be determined
   */
  async getPersonalizedPosts(
    accountToken: string,
    query: PersonalizedBlogQueryDto,
  ) {
    const { page = 1, limit = 6 } = query;
    const skip = (page - 1) * limit;

    // Track which sources contributed to personalization
    const interestSources: InterestSources = {
      hasOwnProducts: false,
      hasWishlistProducts: false,
      hasAiContacts: false,
      hasTrades: false,
    };

    try {
      // Validate token and get user ID
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        // Return general posts if no valid user
        const result = await this.getPublishedPosts({ page, limit });
        return { ...result, isPersonalized: false, interestSources };
      }

      // Extract interests from all 4 sources in parallel
      const [productInterests, wishlistInterests, aiContactInterests, tradeInterests] =
        await Promise.all([
          this.extractProductInterests(userId),
          this.extractWishlistInterests(userId),
          this.extractAiContactInterests(userId),
          this.extractTradeInterests(userId),
        ]);

      // Track which sources had data
      interestSources.hasOwnProducts =
        productInterests.categories.length > 0 ||
        productInterests.tags.length > 0 ||
        productInterests.hsnPrefixes.length > 0;
      interestSources.hasWishlistProducts =
        wishlistInterests.categories.length > 0 ||
        wishlistInterests.tags.length > 0 ||
        wishlistInterests.hsnPrefixes.length > 0;
      interestSources.hasAiContacts =
        aiContactInterests.categories.length > 0 ||
        aiContactInterests.tags.length > 0 ||
        aiContactInterests.hsnPrefixes.length > 0;
      interestSources.hasTrades =
        tradeInterests.categories.length > 0 ||
        tradeInterests.tags.length > 0 ||
        tradeInterests.hsnPrefixes.length > 0;

      // Check if any source has data
      const hasAnyInterests =
        interestSources.hasOwnProducts ||
        interestSources.hasWishlistProducts ||
        interestSources.hasAiContacts ||
        interestSources.hasTrades;

      if (!hasAnyInterests) {
        // No interests from any source, return recent published posts
        const result = await this.getPublishedPosts({ page, limit });
        return { ...result, isPersonalized: false, interestSources };
      }

      // Combine all interests with weighting
      const combinedInterests = this.combineInterests(
        tradeInterests,
        productInterests,
        wishlistInterests,
        aiContactInterests,
      );

      const { categories, tags, hsnPrefixes } = combinedInterests;

      // Weighted aggregation for relevance scoring
      // Uses case-insensitive matching by normalizing blog data at query time
      const pipeline: any[] = [
        {
          $match: {
            status: 'published',
            isDeleted: false,
          },
        },
        {
          $addFields: {
            // Normalize categories and tags to lowercase for matching
            normalizedCategories: {
              $map: {
                input: { $ifNull: ['$categories', []] },
                as: 'cat',
                in: { $toLower: '$$cat' },
              },
            },
            normalizedTags: {
              $map: {
                input: { $ifNull: ['$tags', []] },
                as: 'tag',
                in: { $toLower: '$$tag' },
              },
            },
          },
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                // Category match: 3 points each
                {
                  $multiply: [
                    3,
                    {
                      $size: {
                        $ifNull: [
                          {
                            $setIntersection: ['$normalizedCategories', categories],
                          },
                          [],
                        ],
                      },
                    },
                  ],
                },
                // Tag match: 2 points each
                {
                  $multiply: [
                    2,
                    {
                      $size: {
                        $ifNull: [
                          { $setIntersection: ['$normalizedTags', tags] },
                          [],
                        ],
                      },
                    },
                  ],
                },
                // HSN prefix match: 2 points each
                {
                  $multiply: [
                    2,
                    {
                      $size: {
                        $ifNull: [
                          {
                            $setIntersection: ['$hsnCodePrefixes', hsnPrefixes],
                          },
                          [],
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        // Sort by relevance, then by publishedAt
        { $sort: { relevanceScore: -1, publishedAt: -1 } },
        // Pagination
        { $skip: skip },
        { $limit: limit },
        // Exclude heavy fields and temporary fields
        {
          $project: {
            tiptapContent: 0,
            isDeleted: 0,
            deletedAt: 0,
            normalizedCategories: 0,
            normalizedTags: 0,
          },
        },
      ];

      const posts = await this.blogPostModel.aggregate(pipeline);

      // Populate author
      await this.blogPostModel.populate(posts, {
        path: 'author',
        select: 'email name',
      });

      // Get total count for pagination
      const total = await this.blogPostModel.countDocuments({
        status: 'published',
        isDeleted: false,
      });

      return {
        posts,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
        isPersonalized: true,
        interestSources,
      };
    } catch (error) {
      // On any error, fall back to general posts
      console.error('Personalization error:', error.message);
      const result = await this.getPublishedPosts({ page, limit });
      return { ...result, isPersonalized: false, interestSources };
    }
  }

  /**
   * Get available categories from published posts
   */
  async getCategories() {
    const categories = await this.blogPostModel.aggregate([
      { $match: { status: 'published', isDeleted: false } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    return categories;
  }

  /**
   * Get popular tags from published posts
   */
  async getPopularTags(limit: number = 20) {
    const tags = await this.blogPostModel.aggregate([
      { $match: { status: 'published', isDeleted: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]);

    return tags;
  }

  /**
   * Get featured/hero post for the blog homepage.
   * Uses the pinned post if one exists, otherwise falls back to most viewed.
   */
  async getFeaturedPost(): Promise<BlogPost | null> {
    // First try to get the pinned post
    let post = await this.blogPostModel
      .findOne({
        status: 'published',
        isDeleted: false,
        isPinned: true,
      })
      .select('-isDeleted -deletedAt')
      .populate('author', 'email name')
      .sort({ publishedAt: -1 })
      .lean();

    if (post) return post;

    // Fallback: get most viewed post
    post = await this.blogPostModel
      .findOne({
        status: 'published',
        isDeleted: false,
      })
      .select('-isDeleted -deletedAt')
      .populate('author', 'email name')
      .sort({ viewCount: -1 })
      .lean();

    return post;
  }

  /**
   * Get all pinned posts for carousel display
   */
  async getPinnedPosts(limit: number = 10): Promise<BlogPost[]> {
    const posts = await this.blogPostModel
      .find({
        status: 'published',
        isDeleted: false,
        isPinned: true,
      })
      .select('-isDeleted -deletedAt')
      .populate('author', 'email name')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return posts;
  }

  /**
   * Get trending posts (sorted by view count)
   */
  async getTrendingPosts(limit: number = 6): Promise<BlogPost[]> {
    const posts = await this.blogPostModel
      .find({
        status: 'published',
        isDeleted: false,
      })
      .select('-isDeleted -deletedAt')
      .populate('author', 'email name')
      .sort({ viewCount: -1, likeCount: -1, publishedAt: -1 })
      .limit(limit)
      .lean();

    return posts;
  }

  /**
   * Search posts by query string
   */
  async searchPosts(
    query: string,
    params: { category?: string; tag?: string; page?: number; limit?: number },
  ) {
    const { category, tag, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const filter: any = {
      status: 'published',
      isDeleted: false,
    };

    // Text search if query provided
    if (query && query.trim()) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { categories: { $in: [new RegExp(query, 'i')] } },
      ];
    }

    if (category) {
      // Case-insensitive category match - supports both slugs and display names
      filter.categories = {
        $regex: new RegExp(`^${category.replace(/-/g, '[- ]?')}$`, 'i'),
      };
    }

    if (tag) {
      // Case-insensitive tag match
      filter.tags = { $regex: new RegExp(`^${tag}$`, 'i') };
    }

    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-tiptapContent -isDeleted -deletedAt')
        .populate('author', 'email name')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogPostModel.countDocuments(filter),
    ]);

    return {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get related posts based on categories and tags
   */
  async getRelatedPosts(postId: string, limit: number = 4) {
    const post = await this.blogPostModel
      .findById(postId)
      .select('categories tags hsnCodePrefixes')
      .lean();

    if (!post) {
      return [];
    }

    const relatedPosts = await this.blogPostModel
      .find({
        _id: { $ne: new Types.ObjectId(postId) },
        status: 'published',
        isDeleted: false,
        $or: [
          { categories: { $in: post.categories || [] } },
          { tags: { $in: post.tags || [] } },
          { hsnCodePrefixes: { $in: post.hsnCodePrefixes || [] } },
        ],
      })
      .select('-tiptapContent -isDeleted -deletedAt')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return relatedPosts;
  }
}
