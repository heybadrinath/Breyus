import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogLike } from '../schemas/blog-like.schema';
import { BlogPost } from '../../blog/schemas/blog-post.schema';

/**
 * BlogPortalPostsService handles post interactions for authenticated blog users
 * - Like/unlike posts
 * - Track shares
 */
@Injectable()
export class BlogPortalPostsService {
  constructor(
    @InjectModel(BlogLike.name) private readonly blogLikeModel: Model<BlogLike>,
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
  ) {}

  /**
   * Like a post
   * Uses try-catch to handle race conditions with the unique compound index
   */
  async likePost(postId: string, blogUserId: string) {
    // Check if post exists
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      status: 'published',
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Try to create like - the unique index on (blogPostId, blogUserId) prevents duplicates
      await this.blogLikeModel.create({
        blogPostId: new Types.ObjectId(postId),
        blogUserId: new Types.ObjectId(blogUserId),
      });

      // Increment like count atomically
      const updatedPost = await this.blogPostModel.findOneAndUpdate(
        { _id: new Types.ObjectId(postId) },
        { $inc: { likeCount: 1 } },
        { new: true },
      );

      return {
        isLiked: true,
        likeCount: updatedPost?.likeCount || (post.likeCount || 0) + 1,
      };
    } catch (error: any) {
      // Check if it's a duplicate key error (code 11000)
      if (error.code === 11000) {
        // Already liked - return current state
        return {
          isLiked: true,
          likeCount: post.likeCount || 0,
        };
      }
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, blogUserId: string) {
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      status: 'published',
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    // Find and delete like
    const result = await this.blogLikeModel.deleteOne({
      blogPostId: new Types.ObjectId(postId),
      blogUserId: new Types.ObjectId(blogUserId),
    });

    if (result.deletedCount > 0) {
      // Decrement like count
      await this.blogPostModel.updateOne(
        { _id: new Types.ObjectId(postId) },
        { $inc: { likeCount: -1 } },
      );
    }

    return {
      isLiked: false,
      likeCount: Math.max(
        0,
        (post.likeCount || 0) - (result.deletedCount > 0 ? 1 : 0),
      ),
    };
  }

  /**
   * Get like status for a post
   */
  async getLikeStatus(postId: string, blogUserId: string) {
    const [post, existingLike] = await Promise.all([
      this.blogPostModel
        .findOne({
          _id: new Types.ObjectId(postId),
          status: 'published',
          isDeleted: false,
        })
        .select('likeCount'),
      this.blogLikeModel.findOne({
        blogPostId: new Types.ObjectId(postId),
        blogUserId: new Types.ObjectId(blogUserId),
      }),
    ]);

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return {
      isLiked: !!existingLike,
      likeCount: post.likeCount || 0,
    };
  }

  /**
   * Record a share (increment share count)
   */
  async recordShare(postId: string) {
    const result = await this.blogPostModel.updateOne(
      {
        _id: new Types.ObjectId(postId),
        status: 'published',
        isDeleted: false,
      },
      { $inc: { shareCount: 1 } },
    );

    if (result.matchedCount === 0) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return { success: true };
  }
}
