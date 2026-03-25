import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogComment } from '../schemas/blog-comment.schema';
import { BlogPost } from '../../blog/schemas/blog-post.schema';
import { BlogUser } from '../schemas/blog-user.schema';

/**
 * BlogPortalCommentsService handles comment operations
 */
@Injectable()
export class BlogPortalCommentsService {
  constructor(
    @InjectModel(BlogComment.name)
    private readonly blogCommentModel: Model<BlogComment>,
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
  ) {}

  /**
   * Get comments for a post
   * Optimized to avoid N+1 queries by using aggregation
   */
  async getComments(postId: string) {
    // Verify post exists
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      status: 'published',
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    // Use aggregation to get all comments and replies in a single query with user population
    const allComments = await this.blogCommentModel.aggregate([
      {
        $match: {
          blogPostId: new Types.ObjectId(postId),
          isHidden: false,
          deletedAt: null,
        },
      },
      // Lookup user info for each comment
      {
        $lookup: {
          from: 'blog_users',
          localField: 'blogUserId',
          foreignField: '_id',
          as: 'userArr',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                companyName: 1,
                isBrèyusMember: 1,
                isWriter: 1,
                writerBio: 1,
                writerAvatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$userArr', 0] },
        },
      },
      {
        $project: {
          userArr: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // Separate root comments and replies
    const rootComments: any[] = [];
    const repliesMap = new Map<string, any[]>();

    for (const comment of allComments) {
      if (!comment.parentId) {
        rootComments.push({ ...comment, replies: [] });
      } else {
        const parentIdStr = comment.parentId.toString();
        if (!repliesMap.has(parentIdStr)) {
          repliesMap.set(parentIdStr, []);
        }
        repliesMap.get(parentIdStr)!.push(comment);
      }
    }

    // Attach replies to root comments
    for (const comment of rootComments) {
      const replies = repliesMap.get(comment._id.toString()) || [];
      // Sort replies by createdAt ascending
      comment.replies = replies.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return {
      comments: rootComments,
      total: rootComments.length,
    };
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    blogUserId: string,
    payload: { content: string; parentId?: string },
  ) {
    // Verify post exists
    const post = await this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      status: 'published',
      isDeleted: false,
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    // If parentId provided, verify parent comment exists
    if (payload.parentId) {
      const parentComment = await this.blogCommentModel.findOne({
        _id: new Types.ObjectId(payload.parentId),
        blogPostId: new Types.ObjectId(postId),
        deletedAt: null,
      });

      if (!parentComment) {
        throw new HttpException(
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Create comment
    const comment = await this.blogCommentModel.create({
      blogPostId: new Types.ObjectId(postId),
      blogUserId: new Types.ObjectId(blogUserId),
      content: payload.content,
      parentId: payload.parentId ? new Types.ObjectId(payload.parentId) : null,
      isFlagged: false,
      flagCount: 0,
      flagReasons: [],
      isHidden: false,
    });

    // Increment comment count on post
    await this.blogPostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { commentCount: 1 } },
    );

    // Get user info
    const user = await this.blogUserModel
      .findById(blogUserId)
      .select(
        'firstName lastName companyName isBrèyusMember isWriter writerBio writerAvatar',
      )
      .lean();

    return {
      ...comment.toObject(),
      user,
    };
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, blogUserId: string) {
    const comment = await this.blogCommentModel.findOne({
      _id: new Types.ObjectId(commentId),
      blogUserId: new Types.ObjectId(blogUserId),
      deletedAt: null,
    });

    if (!comment) {
      throw new HttpException(
        'Comment not found or not authorized',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    await this.blogCommentModel.updateOne(
      { _id: new Types.ObjectId(commentId) },
      { deletedAt: new Date() },
    );

    // Decrement comment count on post
    await this.blogPostModel.updateOne(
      { _id: comment.blogPostId },
      { $inc: { commentCount: -1 } },
    );

    return { success: true };
  }

  /**
   * Flag a comment for review
   */
  async flagComment(commentId: string, blogUserId: string, reason: string) {
    const comment = await this.blogCommentModel.findOne({
      _id: new Types.ObjectId(commentId),
      deletedAt: null,
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Don't allow flagging your own comment
    if (comment.blogUserId.toString() === blogUserId) {
      throw new HttpException(
        'Cannot flag your own comment',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update flag count and reasons
    await this.blogCommentModel.updateOne(
      { _id: new Types.ObjectId(commentId) },
      {
        $inc: { flagCount: 1 },
        $push: { flagReasons: reason },
        isFlagged: true,
      },
    );

    return { success: true };
  }
}
