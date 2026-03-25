import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogPortalPostsService } from './blog-portal-posts.service';
import { BlogAuthGuard } from '../auth/guards/blog-auth.guard';
import { BlogUserDecorator } from '../auth/decorators/blog-user.decorator';

/**
 * BlogPortalPostsController handles post interactions
 * All routes require blog portal authentication
 *
 * Routes:
 * - POST /blog-portal/posts/:postId/like - Like a post
 * - DELETE /blog-portal/posts/:postId/like - Unlike a post
 * - GET /blog-portal/posts/:postId/like - Get like status
 * - POST /blog-portal/posts/:postId/share - Record a share
 */
@Controller('blog-portal/posts')
@UseGuards(BlogAuthGuard)
export class BlogPortalPostsController {
  constructor(private readonly postsService: BlogPortalPostsService) {}

  /**
   * Like a post
   */
  @Post(':postId/like')
  async likePost(
    @Param('postId') postId: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.postsService.likePost(postId, blogUserId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post liked successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to like post',
      });
    }
  }

  /**
   * Unlike a post
   */
  @Delete(':postId/like')
  async unlikePost(
    @Param('postId') postId: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.postsService.unlikePost(postId, blogUserId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post unliked successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to unlike post',
      });
    }
  }

  /**
   * Get like status for a post
   */
  @Get(':postId/like')
  async getLikeStatus(
    @Param('postId') postId: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.postsService.getLikeStatus(postId, blogUserId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Like status retrieved successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get like status',
      });
    }
  }

  /**
   * Record a share (increment share count)
   */
  @Post(':postId/share')
  async recordShare(
    @Param('postId') postId: string,
    @Res() response: Response,
  ) {
    try {
      await this.postsService.recordShare(postId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Share recorded successfully',
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to record share',
      });
    }
  }
}
