import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  BlogPost,
  BlogStatus,
  BlogAccessLevel,
} from '../../blog/schemas/blog-post.schema';
import { BlogUser } from '../../blog-portal/schemas/blog-user.schema';
import { BlogWriterInvite } from '../../blog-portal/schemas/blog-writer-invite.schema';
import { BlogComment } from '../../blog-portal/schemas/blog-comment.schema';
import { BlogLike } from '../../blog-portal/schemas/blog-like.schema';
import { CreateBlogPostDto } from '../../blog/dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../../blog/dto/update-blog-post.dto';
import { AdminBlogQueryDto } from '../../blog/dto/blog-query.dto';
import { BlogService } from '../../blog/blog.service';

/**
 * AdminBlogService handles admin CRUD operations for blog posts
 *
 * Features:
 * - Create/Update/Delete blog posts with Tiptap content
 * - Full editorial workflow (draft → submitted → approved → published)
 * - Image upload handling
 * - Writer submission approval/rejection
 * - Access level management (public vs member_only)
 * - Writer and invite management
 */
@Injectable()
export class AdminBlogService {
  constructor(
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
    @InjectModel(BlogWriterInvite.name)
    private readonly blogWriterInviteModel: Model<BlogWriterInvite>,
    @InjectModel(BlogComment.name)
    private readonly blogCommentModel: Model<BlogComment>,
    @InjectModel(BlogLike.name) private readonly blogLikeModel: Model<BlogLike>,
  ) {}

  /**
   * Create a new blog post (as draft by default)
   *
   * Handles slug race conditions by catching duplicate key errors
   * and auto-appending a timestamp to create a unique slug.
   */
  async createPost(createDto: CreateBlogPostDto, authorId: string) {
    // Generate slug if not provided
    let slug = createDto.slug || BlogService.generateSlug(createDto.title);

    // Calculate read time from Tiptap content
    const readTimeMinutes =
      createDto.readTimeMinutes ||
      BlogService.calculateReadTime(createDto.tiptapContent || null);

    // Generate excerpt from Tiptap content if not provided
    const excerpt =
      createDto.excerpt ||
      BlogService.generateExcerpt(createDto.tiptapContent || null);

    // Attempt to create the post with retry logic for slug conflicts
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const post = new this.blogPostModel({
          ...createDto,
          slug,
          excerpt,
          readTimeMinutes,
          contentFormat: 'tiptap',
          author: new Types.ObjectId(authorId),
          status: createDto.status || 'draft',
          accessLevel: createDto.accessLevel || 'public',
          publishedAt: createDto.status === 'published' ? new Date() : undefined,
        });

        const savedPost = await post.save();
        return savedPost.toObject();
      } catch (error) {
        // Check if this is a duplicate key error (code 11000)
        if (error.code === 11000 && error.keyPattern?.slug) {
          // Append timestamp to make slug unique
          const timestamp = Date.now().toString(36); // Base36 for shorter string
          slug = `${BlogService.generateSlug(createDto.title)}-${timestamp}`;
          lastError = error;
          continue; // Retry with new slug
        }
        // Re-throw other errors
        throw error;
      }
    }

    // If we exhausted retries, throw a user-friendly error
    throw new HttpException(
      `Could not create post: slug conflict persists. Please try a different title.`,
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Check if a slug is available (not already in use)
   * Fix: Client-side validation to prevent duplicate slug errors
   */
  async checkSlugAvailability(
    slug: string,
    excludePostId?: string,
  ): Promise<{ available: boolean; existingPostId?: string }> {
    if (!slug || !slug.trim()) {
      return { available: false };
    }

    const filter: any = {
      slug: slug.trim().toLowerCase(),
      isDeleted: false,
    };

    // Exclude the current post when editing
    if (excludePostId && Types.ObjectId.isValid(excludePostId)) {
      filter._id = { $ne: new Types.ObjectId(excludePostId) };
    }

    const existingPost = await this.blogPostModel
      .findOne(filter)
      .select('_id')
      .lean();

    if (existingPost) {
      return {
        available: false,
        existingPostId: existingPost._id.toString(),
      };
    }

    return { available: true };
  }

  /**
   * Get all blog posts with admin filters (including all statuses)
   */
  async getPosts(query: AdminBlogQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      authorId,
      writerId,
      accessLevel,
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

    if (writerId) {
      filter.writerId = new Types.ObjectId(writerId);
    }

    if (accessLevel) {
      filter.accessLevel = accessLevel;
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

    const [rawPosts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-tiptapContent') // Exclude heavy content field for list
        .populate('author', 'email name')
        .populate('writerId', 'email firstName lastName')
        .populate('reviewedBy', 'email name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogPostModel.countDocuments(filter),
    ]);

    // Transform posts to include readTime alias for frontend compatibility
    const posts = rawPosts.map((post: any) => ({
      ...post,
      readTime: post.readTimeMinutes, // Alias for frontend
    }));

    return {
      posts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get posts pending review (submitted status)
   */
  async getPendingReviewPosts(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    return this.getPosts({
      page,
      limit,
      status: 'submitted' as BlogStatus,
      sortBy: 'submittedAt',
      sortOrder: 'asc',
    });
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
      .populate('writerId', 'email firstName lastName writerBio writerAvatar')
      .populate('reviewedBy', 'email name')
      .lean();

    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    // Add readTime alias for frontend compatibility
    return {
      ...post,
      readTime: (post as any).readTimeMinutes,
    };
  }

  /**
   * Update an existing blog post
   *
   * Handles slug race conditions by catching duplicate key errors
   * and providing a clear error message.
   */
  async updatePost(id: string, updateDto: UpdateBlogPostDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    // Recalculate read time if content changed
    if (updateDto.tiptapContent) {
      updateDto.readTimeMinutes = BlogService.calculateReadTime(
        updateDto.tiptapContent,
      );
    }

    try {
      // Update the post
      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
        .populate('author', 'email name')
        .populate('writerId', 'email firstName lastName')
        .lean();

      return updatedPost;
    } catch (error) {
      // Handle duplicate key error for slug
      if (error.code === 11000 && error.keyPattern?.slug) {
        throw new HttpException(
          `A post with slug "${updateDto.slug}" already exists. Please choose a different slug.`,
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * Approve a submitted post (moves to approved status)
   */
  async approvePost(id: string, reviewerId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (post.status !== 'submitted' && post.status !== 'in_review') {
      throw new HttpException(
        `Cannot approve a post with status "${post.status}". Post must be submitted or in review.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'approved',
          reviewedBy: new Types.ObjectId(reviewerId),
          reviewedAt: new Date(),
          rejectionReason: null,
          revisionNotes: null,
        },
        { new: true },
      )
      .populate('author', 'email name')
      .populate('writerId', 'email firstName lastName')
      .lean();

    return updatedPost;
  }

  /**
   * Reject a submitted post
   */
  async rejectPost(id: string, reviewerId: string, reason: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    if (!reason || reason.trim().length === 0) {
      throw new HttpException(
        'Rejection reason is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (post.status !== 'submitted' && post.status !== 'in_review') {
      throw new HttpException(
        `Cannot reject a post with status "${post.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          reviewedBy: new Types.ObjectId(reviewerId),
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        },
        { new: true },
      )
      .populate('author', 'email name')
      .populate('writerId', 'email firstName lastName')
      .lean();

    return updatedPost;
  }

  /**
   * Request revisions on a submitted post
   */
  async requestRevision(id: string, reviewerId: string, notes: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    if (!notes || notes.trim().length === 0) {
      throw new HttpException(
        'Revision notes are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    if (post.status !== 'submitted' && post.status !== 'in_review') {
      throw new HttpException(
        `Cannot request revision for a post with status "${post.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'revision_requested',
          reviewedBy: new Types.ObjectId(reviewerId),
          reviewedAt: new Date(),
          revisionNotes: notes.trim(),
        },
        { new: true },
      )
      .populate('author', 'email name')
      .populate('writerId', 'email firstName lastName')
      .lean();

    return updatedPost;
  }

  /**
   * Publish a blog post (Admin can bypass editorial workflow)
   *
   * Publishable from: draft, submitted, in_review, approved
   * NOT publishable from: rejected, revision_requested, deleted, published
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
      throw new HttpException(
        'Post is already published',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Admin can publish from these statuses:
    // - 'approved': Standard workflow completion
    // - 'draft': Admin can bypass workflow and publish directly
    // - 'submitted', 'in_review': Admin can fast-track writer submissions
    const publishableStatuses = ['approved', 'draft', 'submitted', 'in_review'];

    if (!publishableStatuses.includes(post.status)) {
      throw new HttpException(
        `Cannot publish a post with status "${post.status}". Post must be in draft, submitted, in review, or approved status.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate post has required content
    if (!post.title || !post.tiptapContent) {
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
      .populate('writerId', 'email firstName lastName')
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

    if (post.status !== 'published') {
      throw new HttpException('Post is not published', HttpStatus.BAD_REQUEST);
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
      .populate('writerId', 'email firstName lastName')
      .lean();

    return updatedPost;
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(id, { isFeatured: !post.isFeatured }, { new: true })
      .lean();

    return updatedPost;
  }

  /**
   * Toggle pinned status — only one post can be pinned at a time.
   * If pinning a new post, all other pinned posts are unpinned first.
   */
  async togglePinned(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    const willPin = !post.isPinned;

    // If we're pinning this post, unpin all others first
    if (willPin) {
      await this.blogPostModel.updateMany(
        { isPinned: true, _id: { $ne: post._id } },
        { isPinned: false },
      );
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(id, { isPinned: willPin }, { new: true })
      .lean();

    return updatedPost;
  }

  /**
   * Update access level
   */
  async updateAccessLevel(id: string, accessLevel: BlogAccessLevel) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
    }

    const post = await this.blogPostModel.findById(id);
    if (!post) {
      throw new HttpException('Blog post not found', HttpStatus.NOT_FOUND);
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(id, { accessLevel }, { new: true })
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
      .populate('writerId', 'email firstName lastName')
      .lean();

    return restoredPost;
  }

  /**
   * Get blog statistics for admin dashboard
   */
  async getStats() {
    const [
      total,
      published,
      drafts,
      submitted,
      inReview,
      approved,
      rejected,
      deleted,
      memberOnly,
      pinned,
      topCategories,
      recentPosts,
    ] = await Promise.all([
      this.blogPostModel.countDocuments({ isDeleted: false }),
      this.blogPostModel.countDocuments({
        status: 'published',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({ status: 'draft', isDeleted: false }),
      this.blogPostModel.countDocuments({
        status: 'submitted',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({
        status: 'in_review',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({
        status: 'approved',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({
        status: 'rejected',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({ isDeleted: true }),
      this.blogPostModel.countDocuments({
        accessLevel: 'member_only',
        status: 'published',
        isDeleted: false,
      }),
      this.blogPostModel.countDocuments({
        isPinned: true,
        isDeleted: false,
      }),
      this.blogPostModel.aggregate([
        { $match: { status: 'published', isDeleted: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      this.blogPostModel
        .find({ isDeleted: false })
        .select('title status publishedAt createdAt viewCount accessLevel')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      total,
      published,
      drafts,
      submitted,
      inReview,
      approved,
      rejected,
      deleted,
      memberOnly,
      pinned,
      topCategories: topCategories.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      recentPosts,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Writer Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all writers with their post statistics
   */
  async getWriters() {
    const writers = await this.blogUserModel
      .find({ isWriter: true })
      .select(
        'email firstName lastName companyName isBrèyusMember isWriter writerBio writerAvatar writerApprovedAt createdAt',
      )
      .lean();

    // Get post counts and view counts for each writer
    const writerStats = await this.blogPostModel.aggregate([
      {
        $match: {
          writerId: { $in: writers.map((w) => w._id) },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$writerId',
          postCount: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
        },
      },
    ]);

    // Create a map for quick lookup
    const statsMap = new Map(
      writerStats.map((s) => [
        s._id.toString(),
        { postCount: s.postCount, totalViews: s.totalViews },
      ]),
    );

    // Merge stats with writer data
    const writersWithStats = writers.map((writer) => {
      const stats = statsMap.get(writer._id.toString()) || {
        postCount: 0,
        totalViews: 0,
      };
      return {
        ...writer,
        postCount: stats.postCount,
        totalViews: stats.totalViews,
      };
    });

    return { writers: writersWithStats };
  }

  /**
   * Remove writer status from a user
   */
  async removeWriter(writerId: string) {
    if (!Types.ObjectId.isValid(writerId)) {
      throw new HttpException('Invalid writer ID', HttpStatus.BAD_REQUEST);
    }

    const writer = await this.blogUserModel.findById(writerId);
    if (!writer) {
      throw new HttpException('Writer not found', HttpStatus.NOT_FOUND);
    }

    if (!writer.isWriter) {
      throw new HttpException('User is not a writer', HttpStatus.BAD_REQUEST);
    }

    await this.blogUserModel.findByIdAndUpdate(writerId, {
      isWriter: false,
      writerInviteToken: null,
      writerApprovedAt: null,
    });

    return { message: 'Writer status removed successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // Invite Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all writer invites
   */
  async getWriterInvites() {
    const invites = await this.blogWriterInviteModel
      .find()
      .populate('createdBy', 'email name')
      .populate('usedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return { invites };
  }

  /**
   * Create a new writer invite
   */
  async createWriterInvite(
    adminId: string,
    payload: { emailHint?: string; adminNote?: string },
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    const invite = new this.blogWriterInviteModel({
      token,
      createdBy: new Types.ObjectId(adminId),
      expiresAt,
      emailHint: payload.emailHint || null,
      adminNote: payload.adminNote || null,
    });

    const savedInvite = await invite.save();

    // Populate the createdBy field for the response
    await savedInvite.populate('createdBy', 'email name');

    return savedInvite.toObject();
  }

  /**
   * Revoke a writer invite
   */
  async revokeWriterInvite(inviteId: string) {
    if (!Types.ObjectId.isValid(inviteId)) {
      throw new HttpException('Invalid invite ID', HttpStatus.BAD_REQUEST);
    }

    const invite = await this.blogWriterInviteModel.findById(inviteId);
    if (!invite) {
      throw new HttpException('Invite not found', HttpStatus.NOT_FOUND);
    }

    if (invite.usedBy) {
      throw new HttpException(
        'Cannot revoke a used invite',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.blogWriterInviteModel.findByIdAndDelete(inviteId);

    return { message: 'Invite revoked successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // Comment Moderation
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all comments with filters for admin moderation
   */
  async getComments(query: {
    page?: number;
    limit?: number;
    search?: string;
    flagged?: boolean;
    hidden?: boolean;
  }) {
    const { page = 1, limit = 20, search, flagged, hidden } = query;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null };

    if (flagged) {
      filter.isFlagged = true;
    }

    if (hidden) {
      filter.isHidden = true;
    }

    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const [comments, total] = await Promise.all([
      this.blogCommentModel
        .find(filter)
        .populate({
          path: 'blogPostId',
          select: 'title slug',
        })
        .populate({
          path: 'blogUserId',
          select: 'email firstName lastName isBrèyusMember',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogCommentModel.countDocuments(filter),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get comment moderation statistics
   */
  async getCommentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, flagged, hidden, todayCount] = await Promise.all([
      this.blogCommentModel.countDocuments({ deletedAt: null }),
      this.blogCommentModel.countDocuments({
        isFlagged: true,
        deletedAt: null,
      }),
      this.blogCommentModel.countDocuments({ isHidden: true, deletedAt: null }),
      this.blogCommentModel.countDocuments({
        createdAt: { $gte: today },
        deletedAt: null,
      }),
    ]);

    return {
      total,
      flagged,
      hidden,
      today: todayCount,
    };
  }

  /**
   * Update comment (hide/unhide)
   */
  async updateComment(commentId: string, updates: { isHidden?: boolean }) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new HttpException('Invalid comment ID', HttpStatus.BAD_REQUEST);
    }

    const comment = await this.blogCommentModel.findById(commentId);
    if (!comment || comment.deletedAt) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    const updatedComment = await this.blogCommentModel
      .findByIdAndUpdate(commentId, { $set: updates }, { new: true })
      .populate({
        path: 'blogPostId',
        select: 'title slug',
      })
      .populate({
        path: 'blogUserId',
        select: 'email firstName lastName isBrèyusMember',
      })
      .lean();

    return updatedComment;
  }

  /**
   * Clear all flags from a comment
   */
  async clearCommentFlags(commentId: string) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new HttpException('Invalid comment ID', HttpStatus.BAD_REQUEST);
    }

    const comment = await this.blogCommentModel.findById(commentId);
    if (!comment || comment.deletedAt) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    const updatedComment = await this.blogCommentModel
      .findByIdAndUpdate(
        commentId,
        {
          $set: {
            isFlagged: false,
            flagCount: 0,
            flagReasons: [],
          },
        },
        { new: true },
      )
      .lean();

    return updatedComment;
  }

  /**
   * Permanently delete a comment
   */
  async deleteComment(commentId: string) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new HttpException('Invalid comment ID', HttpStatus.BAD_REQUEST);
    }

    const comment = await this.blogCommentModel.findById(commentId);
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Soft delete with timestamp
    await this.blogCommentModel.findByIdAndUpdate(commentId, {
      $set: { deletedAt: new Date() },
    });

    // Also decrease the comment count on the post
    await this.blogPostModel.updateOne(
      { _id: comment.blogPostId },
      { $inc: { commentCount: -1 } },
    );

    return { message: 'Comment deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // Analytics
  // ─────────────────────────────────────────────────────────────

  /**
   * Get date range filter based on period string
   */
  private getDateRangeFilter(
    period: string,
  ): { $gte?: Date; $lte?: Date } | undefined {
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        return undefined;
    }

    return startDate ? { $gte: startDate } : undefined;
  }

  /**
   * Get analytics overview with trends
   */
  async getAnalyticsOverview(period: string) {
    const dateFilter = this.getDateRangeFilter(period);
    const previousPeriodFilter = this.getPreviousPeriodFilter(period);

    // Base filter for published posts
    const baseFilter: any = { status: 'published', isDeleted: false };
    if (dateFilter) {
      baseFilter.publishedAt = dateFilter;
    }

    // Get current period stats
    const [
      totalPosts,
      publishedPosts,
      postsWithStats,
      totalComments,
      totalWriters,
      activeWriters,
    ] = await Promise.all([
      this.blogPostModel.countDocuments({ isDeleted: false }),
      this.blogPostModel.countDocuments({
        status: 'published',
        isDeleted: false,
      }),
      this.blogPostModel.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' },
            totalLikes: { $sum: '$likeCount' },
            totalShares: { $sum: { $ifNull: ['$shareCount', 0] } },
            postCount: { $sum: 1 },
          },
        },
      ]),
      this.blogCommentModel.countDocuments(
        dateFilter
          ? { createdAt: dateFilter, deletedAt: null }
          : { deletedAt: null },
      ),
      this.blogUserModel.countDocuments({ isWriter: true }),
      this.blogPostModel
        .distinct('writerId', baseFilter)
        .then((ids) => ids.length),
    ]);

    const stats = postsWithStats[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      postCount: 0,
    };

    // Calculate trends (compare with previous period)
    const trends = await this.calculateTrends(period, previousPeriodFilter);

    // Calculate averages
    const avgViewsPerPost =
      stats.postCount > 0 ? stats.totalViews / stats.postCount : 0;
    const avgEngagementRate =
      stats.totalViews > 0
        ? ((stats.totalLikes + totalComments) / stats.totalViews) * 100
        : 0;

    // Get chart data
    const [viewsTrend, postsByStatus, postsByCategory] = await Promise.all([
      this.getViewsTrend(period),
      this.getPostsByStatus(),
      this.getPostsByCategory(),
    ]);

    return {
      totalPosts,
      publishedPosts,
      totalViews: stats.totalViews,
      uniqueViews: Math.round(stats.totalViews * 0.7), // Estimate unique views
      totalLikes: stats.totalLikes,
      totalComments,
      totalShares: stats.totalShares,
      totalWriters,
      activeWriters,
      avgViewsPerPost,
      avgEngagementRate,
      trends,
      // Chart data
      viewsTrend,
      postsByStatus,
      postsByCategory,
    };
  }

  /**
   * Generate views trend data for charts
   */
  private async getViewsTrend(
    period: string,
  ): Promise<{ date: string; views: number; likes: number }[]> {
    const now = new Date();
    let days: number;

    switch (period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '1y':
        days = 365;
        break;
      default:
        days = 30;
    }

    // Get all published posts
    const posts = await this.blogPostModel
      .find({ status: 'published', isDeleted: false })
      .select('viewCount likeCount publishedAt')
      .lean();

    // Generate trend data (simulate daily distribution)
    const trend: { date: string; views: number; likes: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const startDate = new Date(now.getTime() - days * dayMs);

    // Aggregate data by day interval (group by week for longer periods)
    const interval = days > 90 ? 7 : days > 30 ? 3 : 1;

    for (let i = 0; i < days; i += interval) {
      const dayStart = new Date(startDate.getTime() + i * dayMs);
      const dayEnd = new Date(dayStart.getTime() + interval * dayMs);

      // Count posts published in this interval and their metrics
      const postsInPeriod = posts.filter((p) => {
        if (!p.publishedAt) return false;
        const pubDate = new Date(p.publishedAt);
        return pubDate >= dayStart && pubDate < dayEnd;
      });

      // Calculate cumulative metrics up to this point
      const postsUpToDate = posts.filter(
        (p) => p.publishedAt && new Date(p.publishedAt) <= dayEnd,
      );
      const cumulativeViews = postsUpToDate.reduce(
        (sum, p) => sum + (p.viewCount || 0),
        0,
      );
      const cumulativeLikes = postsUpToDate.reduce(
        (sum, p) => sum + (p.likeCount || 0),
        0,
      );

      // Distribute views/likes with some randomization for visual appeal
      const factor =
        Math.min(1, (i + interval) / days) * (0.9 + Math.random() * 0.2);

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        views: Math.round((cumulativeViews * factor) / (days / interval)),
        likes: Math.round((cumulativeLikes * factor) / (days / interval)),
      });
    }

    return trend;
  }

  /**
   * Get posts count by status for pie chart
   */
  private async getPostsByStatus(): Promise<
    { status: string; count: number }[]
  > {
    const statusCounts = await this.blogPostModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return statusCounts.map((s: any) => ({
      status: s._id,
      count: s.count,
    }));
  }

  /**
   * Get posts count by category for bar chart
   */
  private async getPostsByCategory(): Promise<
    { category: string; count: number; views: number }[]
  > {
    const categoryCounts = await this.blogPostModel.aggregate([
      { $match: { status: 'published', isDeleted: false } },
      { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$categories', 'Uncategorized'] },
          count: { $sum: 1 },
          views: { $sum: '$viewCount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return categoryCounts.map((c: any) => ({
      category: c._id,
      count: c.count,
      views: c.views,
    }));
  }

  /**
   * Get previous period filter for trend comparison
   */
  private getPreviousPeriodFilter(
    period: string,
  ): { $gte?: Date; $lt?: Date } | undefined {
    const now = new Date();
    let duration: number;

    switch (period) {
      case '7d':
        duration = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        duration = 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        duration = 90 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        duration = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        return undefined;
    }

    const startDate = new Date(now.getTime() - 2 * duration);
    const endDate = new Date(now.getTime() - duration);

    return { $gte: startDate, $lt: endDate };
  }

  /**
   * Calculate trends by comparing current and previous periods
   */
  private async calculateTrends(
    period: string,
    previousPeriodFilter: { $gte?: Date; $lt?: Date } | undefined,
  ) {
    if (!previousPeriodFilter) {
      return {
        views: { value: 0, change: 0 },
        likes: { value: 0, change: 0 },
        comments: { value: 0, change: 0 },
      };
    }

    const dateFilter = this.getDateRangeFilter(period);

    // Get current period stats
    const currentStats = await this.blogPostModel.aggregate([
      {
        $match: {
          status: 'published',
          isDeleted: false,
          ...(dateFilter ? { publishedAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          views: { $sum: '$viewCount' },
          likes: { $sum: '$likeCount' },
        },
      },
    ]);

    const currentComments = await this.blogCommentModel.countDocuments(
      dateFilter
        ? { createdAt: dateFilter, deletedAt: null }
        : { deletedAt: null },
    );

    // Get previous period stats
    const previousStats = await this.blogPostModel.aggregate([
      {
        $match: {
          status: 'published',
          isDeleted: false,
          publishedAt: previousPeriodFilter,
        },
      },
      {
        $group: {
          _id: null,
          views: { $sum: '$viewCount' },
          likes: { $sum: '$likeCount' },
        },
      },
    ]);

    const previousComments = await this.blogCommentModel.countDocuments({
      createdAt: previousPeriodFilter,
      deletedAt: null,
    });

    const current = currentStats[0] || { views: 0, likes: 0 };
    const previous = previousStats[0] || { views: 0, likes: 0 };

    // Calculate percentage change
    const calcChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      views: {
        value: current.views,
        change: calcChange(current.views, previous.views),
      },
      likes: {
        value: current.likes,
        change: calcChange(current.likes, previous.likes),
      },
      comments: {
        value: currentComments,
        change: calcChange(currentComments, previousComments),
      },
    };
  }

  /**
   * Get post performance analytics
   */
  async getPostPerformance(period: string, sort: string = 'views') {
    const dateFilter = this.getDateRangeFilter(period);

    const filter: any = { status: 'published', isDeleted: false };
    if (dateFilter) {
      filter.publishedAt = dateFilter;
    }

    // Determine sort field
    const sortField: any = {};
    switch (sort) {
      case 'likes':
        sortField.likeCount = -1;
        break;
      case 'comments':
        sortField.commentCount = -1;
        break;
      case 'shares':
        sortField.shareCount = -1;
        break;
      default:
        sortField.viewCount = -1;
    }

    const posts = await this.blogPostModel
      .find(filter)
      .select(
        'title slug viewCount likeCount commentCount shareCount publishedAt categories writerId',
      )
      .populate('writerId', 'firstName lastName')
      .sort(sortField)
      .limit(20)
      .lean();

    return posts.map((post: any) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      views: post.viewCount || 0,
      uniqueViews: Math.round((post.viewCount || 0) * 0.7),
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      publishedAt: post.publishedAt,
      category: post.categories?.[0] || 'Uncategorized',
      writer: post.writerId || { firstName: 'Admin', lastName: '' },
    }));
  }

  /**
   * Get writer performance analytics
   */
  async getWriterPerformance(period: string) {
    const dateFilter = this.getDateRangeFilter(period);

    const filter: any = { status: 'published', isDeleted: false };
    if (dateFilter) {
      filter.publishedAt = dateFilter;
    }

    // Aggregate post stats by writer
    const writerStats = await this.blogPostModel.aggregate([
      { $match: { ...filter, writerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$writerId',
          totalPosts: { $sum: 1 },
          publishedPosts: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
        },
      },
      { $sort: { totalViews: -1 } },
      { $limit: 20 },
    ]);

    // Get writer details
    const writerIds = writerStats.map((s) => s._id);
    const writers = await this.blogUserModel
      .find({ _id: { $in: writerIds } })
      .select('firstName lastName email')
      .lean();

    const writerMap = new Map(writers.map((w) => [w._id.toString(), w]));

    return writerStats.map((stat) => {
      const writer = writerMap.get(stat._id.toString());
      const avgEngagement =
        stat.totalViews > 0
          ? ((stat.totalLikes + stat.totalComments) / stat.totalViews) * 100
          : 0;

      return {
        _id: stat._id,
        firstName: writer?.firstName || 'Unknown',
        lastName: writer?.lastName || '',
        email: writer?.email || '',
        totalPosts: stat.totalPosts,
        publishedPosts: stat.publishedPosts,
        totalViews: stat.totalViews,
        totalLikes: stat.totalLikes,
        totalComments: stat.totalComments,
        avgEngagement,
      };
    });
  }

  /**
   * Get category performance analytics
   */
  async getCategoryPerformance(period: string) {
    const dateFilter = this.getDateRangeFilter(period);

    const filter: any = { status: 'published', isDeleted: false };
    if (dateFilter) {
      filter.publishedAt = dateFilter;
    }

    const categoryStats = await this.blogPostModel.aggregate([
      { $match: filter },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          postCount: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
        },
      },
      { $sort: { totalViews: -1 } },
    ]);

    return categoryStats.map((cat) => ({
      category: cat._id,
      postCount: cat.postCount,
      totalViews: cat.totalViews,
      totalLikes: cat.totalLikes,
      avgEngagement:
        cat.totalViews > 0
          ? ((cat.totalLikes + cat.totalComments) / cat.totalViews) * 100
          : 0,
    }));
  }

  // ============================================
  // BLOG USERS MANAGEMENT
  // ============================================

  /**
   * Get all blog users with filters
   */
  async getBlogUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    isBrèyusMember?: boolean;
    isWriter?: boolean;
    isSuspended?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      isBrèyusMember,
      isWriter,
      isSuspended,
    } = params;

    const filter: any = { isDeleted: { $ne: true } };

    // Apply filters
    if (typeof isBrèyusMember === 'boolean') {
      filter.isBrèyusMember = isBrèyusMember;
    }
    if (typeof isWriter === 'boolean') {
      filter.isWriter = isWriter;
    }
    if (typeof isSuspended === 'boolean') {
      filter.isSuspended = isSuspended;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.blogUserModel
        .find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogUserModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single blog user by ID
   */
  async getBlogUser(userId: string) {
    const user = await this.blogUserModel
      .findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      throw new HttpException('Blog user not found', HttpStatus.NOT_FOUND);
    }

    // Get user's post stats if they're a writer
    let postStats = null;
    if (user.isWriter) {
      const stats = await this.blogPostModel.aggregate([
        { $match: { writerId: new Types.ObjectId(userId), isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            publishedPosts: {
              $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
            },
            totalViews: { $sum: '$viewCount' },
            totalLikes: { $sum: '$likeCount' },
          },
        },
      ]);
      postStats = stats[0] || {
        totalPosts: 0,
        publishedPosts: 0,
        totalViews: 0,
        totalLikes: 0,
      };
    }

    // Get reader engagement stats (likes given, comments posted, recent activity)
    const userObjectId = new Types.ObjectId(userId);

    const [totalLikesGiven, totalComments, recentLikes, recentComments] =
      await Promise.all([
        this.blogLikeModel.countDocuments({ blogUserId: userObjectId }),
        this.blogCommentModel.countDocuments({
          blogUserId: userObjectId,
          deletedAt: null,
        }),
        this.blogLikeModel.aggregate([
          { $match: { blogUserId: userObjectId } },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'blog_posts',
              localField: 'blogPostId',
              foreignField: '_id',
              as: 'post',
            },
          },
          { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              type: { $literal: 'like' },
              createdAt: 1,
              postId: '$blogPostId',
              postTitle: { $ifNull: ['$post.title', 'Deleted Post'] },
              postSlug: { $ifNull: ['$post.slug', null] },
            },
          },
        ]),
        this.blogCommentModel.aggregate([
          { $match: { blogUserId: userObjectId, deletedAt: null } },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'blog_posts',
              localField: 'blogPostId',
              foreignField: '_id',
              as: 'post',
            },
          },
          { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              type: { $literal: 'comment' },
              createdAt: 1,
              content: 1,
              postId: '$blogPostId',
              postTitle: { $ifNull: ['$post.title', 'Deleted Post'] },
              postSlug: { $ifNull: ['$post.slug', null] },
            },
          },
        ]),
      ]);

    // Merge and sort recent activity by date, take top 10
    const recentActivity = [...recentLikes, ...recentComments]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    const readerStats = {
      totalLikesGiven,
      totalComments,
      recentActivity,
    };

    return { user, postStats, readerStats };
  }

  /**
   * Suspend a blog user
   */
  async suspendBlogUser(userId: string, adminId: string, reason: string) {
    const user = await this.blogUserModel.findById(userId);

    if (!user) {
      throw new HttpException('Blog user not found', HttpStatus.NOT_FOUND);
    }

    if (user.isSuspended) {
      throw new HttpException(
        'User is already suspended',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.blogUserModel.findByIdAndUpdate(userId, {
      isSuspended: true,
      suspendedAt: new Date(),
      suspendedBy: adminId,
      suspensionReason: reason,
    });

    return { success: true, message: 'User suspended successfully' };
  }

  /**
   * Unsuspend a blog user
   */
  async unsuspendBlogUser(userId: string) {
    const user = await this.blogUserModel.findById(userId);

    if (!user) {
      throw new HttpException('Blog user not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isSuspended) {
      throw new HttpException('User is not suspended', HttpStatus.BAD_REQUEST);
    }

    await this.blogUserModel.findByIdAndUpdate(userId, {
      isSuspended: false,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
    });

    return { success: true, message: 'User unsuspended successfully' };
  }

  /**
   * Promote a blog user to writer status
   */
  async promoteToWriter(userId: string): Promise<any> {
    const user = await this.blogUserModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.isWriter) {
      throw new HttpException(
        'User is already a writer',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isWriter = true;
    user.writerApprovedAt = new Date();
    await user.save();

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isWriter: user.isWriter,
      writerApprovedAt: user.writerApprovedAt,
    };
  }

  /**
   * Revoke writer status from a blog user
   */
  async revokeWriterStatus(userId: string): Promise<any> {
    const user = await this.blogUserModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isWriter) {
      throw new HttpException('User is not a writer', HttpStatus.BAD_REQUEST);
    }

    user.isWriter = false;
    user.writerApprovedAt = null;
    await user.save();

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isWriter: user.isWriter,
    };
  }

  /**
   * Soft delete a blog user
   */
  async deleteBlogUser(userId: string) {
    const user = await this.blogUserModel.findById(userId);

    if (!user) {
      throw new HttpException('Blog user not found', HttpStatus.NOT_FOUND);
    }

    if (user.isDeleted) {
      throw new HttpException(
        'User is already deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.blogUserModel.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Get blog users statistics
   */
  async getBlogUsersStats() {
    const [
      totalUsers,
      breyusMembers,
      blogOnlyUsers,
      writers,
      suspendedUsers,
      recentSignups,
    ] = await Promise.all([
      this.blogUserModel.countDocuments({ isDeleted: { $ne: true } }),
      this.blogUserModel.countDocuments({
        isBrèyusMember: true,
        isDeleted: { $ne: true },
      }),
      this.blogUserModel.countDocuments({
        isBrèyusMember: false,
        isDeleted: { $ne: true },
      }),
      this.blogUserModel.countDocuments({
        isWriter: true,
        isDeleted: { $ne: true },
      }),
      this.blogUserModel.countDocuments({
        isSuspended: true,
        isDeleted: { $ne: true },
      }),
      this.blogUserModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isDeleted: { $ne: true },
      }),
    ]);

    return {
      totalUsers,
      breyusMembers,
      blogOnlyUsers,
      writers,
      suspendedUsers,
      recentSignups,
    };
  }
}
