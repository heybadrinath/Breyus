import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, BlockContent } from '../../blog/schemas/blog-post.schema';
import { CreateBlogPostDto } from '../../blog/dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../../blog/dto/update-blog-post.dto';
import { AdminBlogQueryDto } from '../../blog/dto/blog-query.dto';
import { BlogService } from '../../blog/blog.service';

/**
 * AdminBlogService handles admin CRUD operations for blog posts
 *
 * Features:
 * - Create/Update/Delete blog posts
 * - Publish/Unpublish workflow
 * - Image upload handling
 * - Draft management
 */
@Injectable()
export class AdminBlogService {
  constructor(
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
  ) {}

  /**
   * Create a new blog post (as draft by default)
   */
  async createPost(createDto: CreateBlogPostDto, authorId: string) {
    // Generate slug if not provided
    const slug = createDto.slug || BlogService.generateSlug(createDto.title);

    // Check for duplicate slug
    const existingPost = await this.blogPostModel.findOne({ slug }).lean();
    if (existingPost) {
      throw new HttpException(
        `A post with slug "${slug}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    // Calculate read time if not provided
    const readTimeMinutes =
      createDto.readTimeMinutes ||
      BlogService.calculateReadTime(createDto.content as BlockContent[]);

    // Generate excerpt if not provided
    const excerpt =
      createDto.excerpt ||
      BlogService.generateExcerpt(createDto.content as BlockContent[]);

    // Create the post
    const post = new this.blogPostModel({
      ...createDto,
      slug,
      excerpt,
      readTimeMinutes,
      author: new Types.ObjectId(authorId),
      status: createDto.status || 'draft',
      publishedAt: createDto.status === 'published' ? new Date() : undefined,
    });

    const savedPost = await post.save();

    return savedPost.toObject();
  }

  /**
   * Get all blog posts with admin filters (including drafts)
   */
  async getPosts(query: AdminBlogQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      authorId,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.categories = category;
    }

    if (authorId) {
      filter.author = new Types.ObjectId(authorId);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort configuration
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-content') // Exclude heavy content field for list
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
    };
  }

  /**
   * Get single post by ID (with full content for editing)
   */
  async getPostById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel
      .findById(id)
      .populate('author', 'email name')
      .lean();

    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  /**
   * Update an existing blog post
   */
  async updatePost(id: string, updateDto: UpdateBlogPostDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    // Check for slug conflict if slug is being changed
    if (updateDto.slug && updateDto.slug !== post.slug) {
      const existingPost = await this.blogPostModel
        .findOne({ slug: updateDto.slug, _id: { $ne: id } })
        .lean();
      if (existingPost) {
        throw new HttpException(
          `A post with slug "${updateDto.slug}" already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    // Recalculate read time if content changed
    if (updateDto.content) {
      updateDto.readTimeMinutes = BlogService.calculateReadTime(
        updateDto.content as BlockContent[],
      );
    }

    // Update the post
    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .populate('author', 'email name')
      .lean();

    return updatedPost;
  }

  /**
   * Publish a draft post
   */
  async publishPost(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (post.status === 'published') {
      throw new HttpException('Post is already published', HttpStatus.BAD_REQUEST);
    }

    // Validate post has required content
    if (!post.title || !post.content || post.content.length === 0) {
      throw new HttpException(
        'Post must have a title and content before publishing',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'published',
          publishedAt: new Date(),
        },
        { new: true },
      )
      .populate('author', 'email name')
      .lean();

    return updatedPost;
  }

  /**
   * Unpublish a post (revert to draft)
   */
  async unpublishPost(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (post.status === 'draft') {
      throw new HttpException('Post is already a draft', HttpStatus.BAD_REQUEST);
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'draft',
        },
        { new: true },
      )
      .populate('author', 'email name')
      .lean();

    return updatedPost;
  }

  /**
   * Soft delete a post
   */
  async deletePost(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    await this.blogPostModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'draft', // Unpublish when deleting
    });

    return { message: 'Post deleted successfully' };
  }

  /**
   * Restore a soft-deleted post
   */
  async restorePost(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (!post.isDeleted) {
      throw new HttpException('Post is not deleted', HttpStatus.BAD_REQUEST);
    }

    const restoredPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: undefined,
        },
        { new: true },
      )
      .populate('author', 'email name')
      .lean();

    return restoredPost;
  }

  /**
   * Get blog statistics for admin dashboard
   */
  async getStats() {
    const [total, published, drafts, deleted, topCategories, recentPosts] =
      await Promise.all([
        this.blogPostModel.countDocuments({ isDeleted: false }),
        this.blogPostModel.countDocuments({ status: 'published', isDeleted: false }),
        this.blogPostModel.countDocuments({ status: 'draft', isDeleted: false }),
        this.blogPostModel.countDocuments({ isDeleted: true }),
        this.blogPostModel.aggregate([
          { $match: { status: 'published', isDeleted: false } },
          { $unwind: '$categories' },
          { $group: { _id: '$categories', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        this.blogPostModel
          .find({ isDeleted: false })
          .select('title status publishedAt createdAt viewCount')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return {
      total,
      published,
      drafts,
      deleted,
      topCategories: topCategories.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      recentPosts,
    };
  }
}
