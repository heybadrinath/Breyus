import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, BlockContent } from './schemas/blog-post.schema';
import { PublicBlogQueryDto, PersonalizedBlogQueryDto } from './dto/blog-query.dto';
import { AuthService } from '../auth/auth.service';

/**
 * BlogService handles public-facing blog operations
 * - Listing published posts with pagination
 * - Interest-based personalization using user's product data
 * - View count tracking
 * - Category and tag aggregations
 */
@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Helper: Generate URL-friendly slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
  }

  /**
   * Helper: Calculate read time based on content
   * Average reading speed: 200-250 words per minute
   */
  static calculateReadTime(content: BlockContent[]): number {
    const wordCount = content.reduce((total, block) => {
      if (block.type === 'divider' || block.type === 'image') {
        return total;
      }
      const words = block.content?.split(/\s+/).length || 0;
      const listWords = block.meta?.items?.join(' ').split(/\s+/).length || 0;
      return total + words + listWords;
    }, 0);

    // Minimum 1 minute, round up
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Helper: Generate excerpt from content blocks
   */
  static generateExcerpt(content: BlockContent[], maxLength: number = 160): string {
    const textBlocks = content.filter(
      (block) => block.type === 'paragraph' || block.type.startsWith('heading'),
    );

    let excerpt = '';
    for (const block of textBlocks) {
      excerpt += block.content + ' ';
      if (excerpt.length >= maxLength) break;
    }

    return excerpt.trim().substring(0, maxLength) + (excerpt.length > maxLength ? '...' : '');
  }

  /**
   * Get published blog posts with pagination and filters
   * Public endpoint - no authentication required
   */
  async getPublishedPosts(query: PublicBlogQueryDto) {
    const { page = 1, limit = 10, search, category, tag, sortBy = 'publishedAt', sortOrder = 'desc' } = query;
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
      filter.categories = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    // Build sort options
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-content -isDeleted -deletedAt') // Exclude full content for list view
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
   * Get single blog post by slug
   * Increments view count on each fetch
   */
  async getPostBySlug(slug: string) {
    const post = await this.blogPostModel
      .findOneAndUpdate(
        { slug, status: 'published', isDeleted: false },
        { $inc: { viewCount: 1 } },
        { new: true },
      )
      .populate('author', 'email name')
      .lean();

    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  /**
   * Get personalized blog posts based on user's product interests
   *
   * Scoring algorithm:
   * - Category match: 3 points (user's product categories)
   * - Tag match: 2 points (user's product tags)
   * - HSN prefix match: 2 points (chapter-level HSN codes)
   *
   * Falls back to recent posts if no user products exist
   */
  async getPersonalizedPosts(accountToken: string, query: PersonalizedBlogQueryDto) {
    const { page = 1, limit = 6 } = query;
    const skip = (page - 1) * limit;

    try {
      // Validate token and get user ID
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        // Return general posts if no valid user
        return this.getPublishedPosts({ page, limit });
      }

      // Get user's products to extract interests
      const userProducts = await this.productModel
        .find({ userId: new Types.ObjectId(userId) })
        .select('category tags hsnCode')
        .lean();

      if (!userProducts || userProducts.length === 0) {
        // User has no products, return recent published posts
        return this.getPublishedPosts({ page, limit });
      }

      // Extract matching criteria from user's products
      const categories = [...new Set(userProducts.map((p: any) => p.category).filter(Boolean))];
      const tags = [...new Set(userProducts.flatMap((p: any) => p.tags || []).filter(Boolean))];
      const hsnPrefixes = [
        ...new Set(
          userProducts
            .map((p: any) => p.hsnCode?.substring(0, 2)) // Chapter level (2 digits)
            .filter(Boolean),
        ),
      ];

      // Weighted aggregation for relevance scoring
      const pipeline: any[] = [
        {
          $match: {
            status: 'published',
            isDeleted: false,
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
                          { $setIntersection: ['$categories', categories] },
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
                        $ifNull: [{ $setIntersection: ['$tags', tags] }, []],
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
                          { $setIntersection: ['$hsnCodePrefixes', hsnPrefixes] },
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
        // Exclude heavy fields
        {
          $project: {
            content: 0,
            isDeleted: 0,
            deletedAt: 0,
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
        isPersonalized: categories.length > 0 || tags.length > 0 || hsnPrefixes.length > 0,
      };
    } catch (error) {
      // On any error, fall back to general posts
      console.error('Personalization error:', error.message);
      return this.getPublishedPosts({ page, limit });
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
      .select('-content -isDeleted -deletedAt')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return relatedPosts;
  }
}
