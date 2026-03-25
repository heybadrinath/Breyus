import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { WriterDashboardService } from './writer-dashboard.service';
import { BlogAuthGuard } from '../auth/guards/blog-auth.guard';
import { BlogWriterGuard } from '../auth/guards/blog-writer.guard';
import { BlogUserDecorator } from '../auth/decorators/blog-user.decorator';
import { StorageService } from '../../common/storage/storage.service';

/**
 * WriterDashboardController handles writer's own post management
 *
 * Routes:
 * - GET /blog-portal/writer/posts - Get own posts
 * - GET /blog-portal/writer/posts/:id - Get post for editing
 * - POST /blog-portal/writer/posts - Create new post
 * - PATCH /blog-portal/writer/posts/:id - Update post
 * - DELETE /blog-portal/writer/posts/:id - Delete draft post
 * - POST /blog-portal/writer/posts/:id/submit - Submit for review
 * - GET /blog-portal/writer/analytics - Get analytics
 * - POST /blog-portal/writer/upload-image - Upload image
 */
@Controller('blog-portal/writer')
@UseGuards(BlogAuthGuard, BlogWriterGuard)
export class WriterDashboardController {
  constructor(
    private readonly dashboardService: WriterDashboardService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get writer's own posts
   */
  @Get('posts')
  async getMyPosts(
    @BlogUserDecorator('_id') writerId: string,
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() response: Response,
  ) {
    try {
      const result = await this.dashboardService.getMyPosts(writerId, {
        status,
        page,
        limit,
      });
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get posts',
      });
    }
  }

  /**
   * Get single post for editing
   */
  @Get('posts/:id')
  async getPost(
    @Param('id') postId: string,
    @BlogUserDecorator('_id') writerId: string,
    @Res() response: Response,
  ) {
    try {
      const post = await this.dashboardService.getPost(postId, writerId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post retrieved successfully',
        data: post,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get post',
      });
    }
  }

  /**
   * Create new post
   */
  @Post('posts')
  async createPost(
    @BlogUserDecorator('_id') writerId: string,
    @Body()
    body: {
      title: string;
      tiptapContent?: Record<string, any>;
      excerpt?: string;
      featuredImage?: string;
      categories?: string[];
      tags?: string[];
    },
    @Res() response: Response,
  ) {
    try {
      const post = await this.dashboardService.createPost(writerId, body);
      return response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Post created successfully',
        data: post,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to create post',
      });
    }
  }

  /**
   * Update post
   */
  @Patch('posts/:id')
  async updatePost(
    @Param('id') postId: string,
    @BlogUserDecorator('_id') writerId: string,
    @Body()
    body: Partial<{
      title: string;
      tiptapContent: Record<string, any>;
      excerpt: string;
      featuredImage: string;
      categories: string[];
      tags: string[];
    }>,
    @Res() response: Response,
  ) {
    try {
      const post = await this.dashboardService.updatePost(
        postId,
        writerId,
        body,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post updated successfully',
        data: post,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to update post',
      });
    }
  }

  /**
   * Delete draft post
   */
  @Delete('posts/:id')
  async deletePost(
    @Param('id') postId: string,
    @BlogUserDecorator('_id') writerId: string,
    @Res() response: Response,
  ) {
    try {
      await this.dashboardService.deletePost(postId, writerId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to delete post',
      });
    }
  }

  /**
   * Submit post for review
   */
  @Post('posts/:id/submit')
  async submitForReview(
    @Param('id') postId: string,
    @BlogUserDecorator('_id') writerId: string,
    @Res() response: Response,
  ) {
    try {
      const post = await this.dashboardService.submitForReview(
        postId,
        writerId,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Post submitted for review',
        data: post,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to submit post',
      });
    }
  }

  /**
   * Get writer's analytics
   */
  @Get('analytics')
  async getAnalytics(
    @BlogUserDecorator('_id') writerId: string,
    @Res() response: Response,
  ) {
    try {
      const analytics = await this.dashboardService.getAnalytics(writerId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get analytics',
      });
    }
  }

  /**
   * Update writer profile (avatar, banner, bio)
   */
  @Patch('profile')
  async updateProfile(
    @BlogUserDecorator() user: any,
    @Body() body: { writerAvatar?: string; writerBanner?: string; writerBio?: string },
    @Res() response: Response,
  ) {
    try {
      const updatedUser = await this.dashboardService.updateWriterProfile(
        user._id,
        body,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Profile updated successfully',
        data: {
          writerAvatar: updatedUser.writerAvatar,
          writerBanner: updatedUser.writerBanner,
          writerBio: updatedUser.writerBio,
        },
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Upload image for blog content
   * Uses memoryStorage so file.buffer is available for StorageService
   */
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          callback(
            new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No image file provided');
      }

      const url = await this.storageService.upload(
        file.buffer,
        file.originalname,
        'blog',
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Image uploaded successfully',
        data: {
          url,
          filename: file.originalname,
        },
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to upload image',
      });
    }
  }
}
