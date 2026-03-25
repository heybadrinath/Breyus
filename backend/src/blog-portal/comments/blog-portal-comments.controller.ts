import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogPortalCommentsService } from './blog-portal-comments.service';
import { BlogAuthGuard } from '../auth/guards/blog-auth.guard';
import { BlogUserDecorator } from '../auth/decorators/blog-user.decorator';

/**
 * BlogPortalCommentsController handles comment operations
 *
 * Routes:
 * - GET /blog-portal/comments/post/:postId - Get comments for a post (public)
 * - POST /blog-portal/comments/post/:postId - Add comment (auth required)
 * - DELETE /blog-portal/comments/:id - Delete own comment (auth required)
 * - POST /blog-portal/comments/:id/flag - Flag comment (auth required)
 */
@Controller('blog-portal/comments')
export class BlogPortalCommentsController {
  constructor(private readonly commentsService: BlogPortalCommentsService) {}

  /**
   * Get comments for a post (public)
   */
  @Get('post/:postId')
  async getComments(
    @Param('postId') postId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.commentsService.getComments(postId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Comments retrieved successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get comments',
      });
    }
  }

  /**
   * Add a comment (auth required)
   */
  @Post('post/:postId')
  @UseGuards(BlogAuthGuard)
  async addComment(
    @Param('postId') postId: string,
    @Body() body: { content: string; parentId?: string },
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      const comment = await this.commentsService.addComment(
        postId,
        blogUserId,
        body,
      );
      return response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Comment added successfully',
        data: comment,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to add comment',
      });
    }
  }

  /**
   * Delete own comment (auth required)
   */
  @Delete(':id')
  @UseGuards(BlogAuthGuard)
  async deleteComment(
    @Param('id') commentId: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      await this.commentsService.deleteComment(commentId, blogUserId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to delete comment',
      });
    }
  }

  /**
   * Flag a comment for review (auth required)
   */
  @Post(':id/flag')
  @UseGuards(BlogAuthGuard)
  async flagComment(
    @Param('id') commentId: string,
    @Body('reason') reason: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      await this.commentsService.flagComment(commentId, blogUserId, reason);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Comment flagged successfully',
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to flag comment',
      });
    }
  }
}
