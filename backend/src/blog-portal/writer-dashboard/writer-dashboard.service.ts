import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogUser } from '../schemas/blog-user.schema';
import { BlogPost } from '../../blog/schemas/blog-post.schema';
import { BlogComment } from '../schemas/blog-comment.schema';
import { BlogService } from '../../blog/blog.service';

/**
 * WriterDashboardService handles writer's own post management
 */
@Injectable()
export class WriterDashboardService {
  constructor(
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
    @InjectModel(BlogComment.name) private readonly blogCommentModel: Model<BlogComment>,
  ) {}

  /**
   * Get writer's own posts
   */
  async getMyPosts(
    writerId: string,
    params?: { status?: string; page?: number; limit?: number },
  ) {
    const { status, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const filter: any = {
      writerId: new Types.ObjectId(writerId),
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find(filter)
        .select('-isDeleted -deletedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogPostModel.countDocuments(filter),
    ]);

    return {
      posts,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single post for editing (must be owned by writer)
   */
  async getPost(postId: string, writerId: string) {
    const post = await this.blogPostModel
      .findOne({
        _id: new Types.ObjectId(postId),
        writerId: new Types.ObjectId(writerId),
        isDeleted: false,
      })
      .select('-isDeleted -deletedAt')
      .lean();

    if (!post) {
      throw new HttpException(
        'Post not found or not authorized',
        HttpStatus.NOT_FOUND,
      );
    }

    return post;
  }

  /**
   * Create new post
   */
  async createPost(
    writerId: string,
    payload: {
      title: string;
      tiptapContent?: Record<string, any>;
      excerpt?: string;
      featuredImage?: string;
      categories?: string[];
      tags?: string[];
    },
  ) {
    // Get writer info
    const writer = await this.blogUserModel.findById(writerId).lean();
    if (!writer || !writer.isWriter) {
      throw new HttpException(
        'Not authorized as a writer',
        HttpStatus.FORBIDDEN,
      );
    }

    // Generate slug
    const baseSlug = BlogService.generateSlug(payload.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await this.blogPostModel.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate read time if content provided
    const readTimeMinutes = payload.tiptapContent
      ? BlogService.calculateReadTime(payload.tiptapContent)
      : 1;

    // Generate excerpt if not provided
    const excerpt =
      payload.excerpt ||
      BlogService.generateExcerpt(payload.tiptapContent || null);

    const post = await this.blogPostModel.create({
      title: payload.title,
      slug,
      tiptapContent: payload.tiptapContent || { type: 'doc', content: [] },
      excerpt,
      featuredImage: payload.featuredImage,
      categories: payload.categories || [],
      tags: payload.tags || [],
      status: 'draft',
      accessLevel: 'public',
      writerId: new Types.ObjectId(writerId),
      writerDisplayName: `${writer.firstName} ${writer.lastName}`,
      writerBio: writer.writerBio || '',
      writerAvatar: writer.writerAvatar || '',
      readTimeMinutes,
      viewCount: 0,
      uniqueViewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isDeleted: false,
    });

    return post.toObject();
  }

  /**
   * Update post (must be draft or revision_requested)
   */
  async updatePost(
    postId: string,
    writerId: string,
    payload: Partial<{
      title: string;
      tiptapContent: Record<string, any>;
      excerpt: string;
      featuredImage: string;
      categories: string[];
      tags: string[];
    }>,
  ) {
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      writerId: new Types.ObjectId(writerId),
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException(
        'Post not found or not authorized',
        HttpStatus.NOT_FOUND,
      );
    }

    // Only allow editing drafts or posts with revision requested
    if (!['draft', 'revision_requested'].includes(post.status)) {
      throw new HttpException(
        'Can only edit draft or revision-requested posts. For published posts, updates require re-approval.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update fields
    const updateData: any = { ...payload };

    // Recalculate slug if title changed
    if (payload.title && payload.title !== post.title) {
      const baseSlug = BlogService.generateSlug(payload.title);
      let slug = baseSlug;
      let counter = 1;

      while (
        await this.blogPostModel.exists({ slug, _id: { $ne: post._id } })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Recalculate read time if content changed
    if (payload.tiptapContent) {
      updateData.readTimeMinutes = BlogService.calculateReadTime(
        payload.tiptapContent,
      );
    }

    // Update excerpt if content changed and no explicit excerpt provided
    if (payload.tiptapContent && !payload.excerpt) {
      updateData.excerpt = BlogService.generateExcerpt(payload.tiptapContent);
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(postId, updateData, { new: true })
      .select('-isDeleted -deletedAt')
      .lean();

    return updatedPost;
  }

  /**
   * Delete draft post
   */
  async deletePost(postId: string, writerId: string) {
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      writerId: new Types.ObjectId(writerId),
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException(
        'Post not found or not authorized',
        HttpStatus.NOT_FOUND,
      );
    }

    // Only allow deleting drafts
    if (post.status !== 'draft') {
      throw new HttpException(
        'Can only delete draft posts',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Soft delete
    await this.blogPostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { isDeleted: true, deletedAt: new Date() },
    );

    return { success: true };
  }

  /**
   * Submit post for review
   */
  async submitForReview(postId: string, writerId: string) {
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      writerId: new Types.ObjectId(writerId),
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException(
        'Post not found or not authorized',
        HttpStatus.NOT_FOUND,
      );
    }

    // Only allow submitting drafts or revision-requested posts
    if (!['draft', 'revision_requested'].includes(post.status)) {
      throw new HttpException(
        'Can only submit draft or revision-requested posts',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate minimum requirements
    if (!post.title || post.title.trim().length < 5) {
      throw new HttpException(
        'Title must be at least 5 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!post.tiptapContent || !post.tiptapContent.content?.length) {
      throw new HttpException('Post must have content', HttpStatus.BAD_REQUEST);
    }

    const updatedPost = await this.blogPostModel
      .findByIdAndUpdate(
        postId,
        {
          status: 'submitted',
          submittedAt: new Date(),
          rejectionReason: null,
          revisionNotes: null,
        },
        { new: true },
      )
      .select('-isDeleted -deletedAt')
      .lean();

    return updatedPost;
  }

  /**
   * Get writer's analytics with trend data
   */
  async getAnalytics(writerId: string) {
    const writerObjectId = new Types.ObjectId(writerId);

    // Get basic stats
    const stats = await this.blogPostModel.aggregate([
      {
        $match: {
          writerId: writerObjectId,
          status: 'published',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
        },
      },
    ]);

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get posts for trend calculation
    const publishedPosts = await this.blogPostModel
      .find({
        writerId: writerObjectId,
        status: 'published',
        isDeleted: false,
      })
      .select('title slug viewCount likeCount commentCount publishedAt')
      .lean();

    // Generate views trend (last 30 days)
    // Since we don't track daily views, simulate trend based on publishedAt
    const viewsTrend = this.generateTrendData(
      publishedPosts,
      'viewCount',
      thirtyDaysAgo,
      now,
    );
    const likesTrend = this.generateTrendData(
      publishedPosts,
      'likeCount',
      thirtyDaysAgo,
      now,
    );

    // Calculate engagement rate
    const totalViews = stats[0]?.totalViews || 0;
    const totalLikes = stats[0]?.totalLikes || 0;
    const totalComments = stats[0]?.totalComments || 0;
    const engagementRate =
      totalViews > 0
        ? Number((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
        : 0;

    // Calculate growth rate (compare last 30 days to previous 30 days)
    const recentPostsCount = publishedPosts.filter(
      (p) => p.publishedAt && new Date(p.publishedAt) >= thirtyDaysAgo,
    ).length;
    const previousPostsCount = publishedPosts.filter((p) => {
      if (!p.publishedAt) return false;
      const pubDate = new Date(p.publishedAt);
      return pubDate >= sixtyDaysAgo && pubDate < thirtyDaysAgo;
    }).length;
    const growthRate =
      previousPostsCount > 0
        ? Number(
            (
              ((recentPostsCount - previousPostsCount) / previousPostsCount) *
              100
            ).toFixed(1),
          )
        : recentPostsCount > 0
          ? null // Return null instead of 100 — frontend shows "New" badge
          : 0;

    // Get top posts by views
    const topPosts = publishedPosts
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        views: p.viewCount,
        likes: p.likeCount,
        comments: p.commentCount,
      }));

    // Recent posts sorted by published date
    const recentPosts = publishedPosts
      .filter((p) => p.publishedAt)
      .sort(
        (a, b) =>
          new Date(b.publishedAt!).getTime() -
          new Date(a.publishedAt!).getTime(),
      )
      .slice(0, 5);

    // Post performance — ALL published posts with full stats
    const postPerformance = publishedPosts
      .sort((a, b) => b.viewCount - a.viewCount)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        views: p.viewCount,
        likes: p.likeCount,
        comments: p.commentCount,
        publishedAt: p.publishedAt,
      }));

    // Recent comments on writer's posts
    const postIds = publishedPosts.map((p) => p._id);
    let recentComments: any[] = [];

    if (postIds.length > 0) {
      recentComments = await this.blogCommentModel.aggregate([
        {
          $match: {
            blogPostId: { $in: postIds },
            deletedAt: null,
            isHidden: { $ne: true },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        // Lookup commenter info
        {
          $lookup: {
            from: 'blog_users',
            localField: 'blogUserId',
            foreignField: '_id',
            as: 'commenter',
          },
        },
        { $unwind: { path: '$commenter', preserveNullAndEmptyArrays: true } },
        // Lookup post info
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
            _id: 1,
            content: { $substr: ['$content', 0, 150] },
            createdAt: 1,
            commenterName: {
              $concat: [
                { $ifNull: ['$commenter.firstName', 'Anonymous'] },
                ' ',
                { $ifNull: [{ $substr: ['$commenter.lastName', 0, 1] }, ''] },
                '.',
              ],
            },
            commenterAvatar: '$commenter.writerAvatar',
            postTitle: '$post.title',
            postSlug: '$post.slug',
          },
        },
      ]);
    }

    return {
      totalPosts: stats[0]?.totalPosts || 0,
      totalViews,
      totalLikes,
      totalComments,
      engagementRate,
      growthRate,
      viewsTrend,
      likesTrend,
      topPosts,
      recentPosts,
      postPerformance,
      recentComments,
    };
  }

  /**
   * Generate trend data for the last N days
   * Distributes total counts across days based on post publish dates
   */
  private generateTrendData(
    posts: any[],
    countField: 'viewCount' | 'likeCount',
    startDate: Date,
    endDate: Date,
  ): { date: string; count: number }[] {
    const trend: { date: string; count: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;

    // Initialize all days with 0
    for (
      let d = new Date(startDate);
      d <= endDate;
      d = new Date(d.getTime() + dayMs)
    ) {
      trend.push({
        date: d.toISOString().split('T')[0],
        count: 0,
      });
    }

    // Distribute counts based on post age
    // Posts published more recently contribute more to recent days
    for (const post of posts) {
      const publishDate = new Date(post.publishedAt);
      const totalCount = post[countField] || 0;
      if (totalCount === 0) continue;

      // Distribute counts with exponential decay from publish date
      const daysFromPublish = Math.ceil(
        (endDate.getTime() - publishDate.getTime()) / dayMs,
      );
      const decayFactor = 0.9; // 10% decay per day

      const remainingCount = totalCount;
      for (let i = 0; i < trend.length && remainingCount > 0; i++) {
        const trendDate = new Date(trend[i].date);
        if (trendDate >= publishDate) {
          const dayIndex = Math.floor(
            (trendDate.getTime() - publishDate.getTime()) / dayMs,
          );
          const dayShare = Math.floor(
            remainingCount *
              (1 - decayFactor) *
              Math.pow(decayFactor, dayIndex),
          );
          trend[i].count += Math.max(
            dayShare,
            dayIndex < daysFromPublish ? 1 : 0,
          );
        }
      }
    }

    return trend;
  }

  /**
   * Update writer profile (avatar, banner, bio)
   */
  async updateWriterProfile(
    userId: string,
    updates: { writerAvatar?: string; writerBanner?: string; writerBio?: string },
  ): Promise<BlogUser> {
    const user = await this.blogUserModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isWriter) {
      throw new HttpException('User is not a writer', HttpStatus.FORBIDDEN);
    }

    // Only update fields that are provided
    if (updates.writerAvatar !== undefined) {
      user.writerAvatar = updates.writerAvatar || null;
    }
    if (updates.writerBanner !== undefined) {
      user.writerBanner = updates.writerBanner || null;
    }
    if (updates.writerBio !== undefined) {
      user.writerBio = updates.writerBio || '';
    }

    await user.save();
    return user;
  }
}
