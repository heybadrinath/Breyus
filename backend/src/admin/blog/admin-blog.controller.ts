import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminBlogService } from './admin-blog.service';
import { CreateBlogPostDto } from '../../blog/dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../../blog/dto/update-blog-post.dto';
import { AdminBlogQueryDto } from '../../blog/dto/blog-query.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { AnyAdmin, AdminOrAbove } from '../auth/decorators/require-role.decorator';
import { AdminAction } from '../activity/admin-action.decorator';

/**
 * AdminBlogController handles admin CRUD operations for blog posts
 *
 * Routes (all prefixed with /admin/blog):
 * - GET /posts - List all posts with filters
 * - GET /posts/:id - Get single post
 * - POST /posts - Create new post
 * - PATCH /posts/:id - Update post
 * - DELETE /posts/:id - Soft delete post
 * - POST /posts/:id/publish - Publish draft
 * - POST /posts/:id/unpublish - Revert to draft
 * - POST /posts/:id/restore - Restore deleted post
 * - POST /upload-image - Upload blog image
 * - GET /stats - Get blog statistics
 */
@Controller('admin/blog')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminBlogController {
  constructor(private readonly adminBlogService: AdminBlogService) {}

  /**
   * Get all blog posts with admin filters
   */
  @Get('posts')
  @AnyAdmin()
  @AdminAction('blog.list', 'content')
  async getPosts(@Query() query: AdminBlogQueryDto) {
    const result = await this.adminBlogService.getPosts(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog posts retrieved successfully',
      data: result,
    };
  }

  /**
   * Get blog statistics for dashboard
   */
  @Get('stats')
  @AnyAdmin()
  async getStats() {
    const stats = await this.adminBlogService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get single post by ID
   */
  @Get('posts/:id')
  @AnyAdmin()
  async getPostById(@Param('id') id: string) {
    const post = await this.adminBlogService.getPostById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post retrieved successfully',
      data: post,
    };
  }

  /**
   * Create new blog post
   */
  @Post('posts')
  @AdminOrAbove()
  @AdminAction('blog.create', 'content')
  async createPost(@Body() createDto: CreateBlogPostDto, @Req() req: any) {
    const adminId = req.admin._id.toString();
    const post = await this.adminBlogService.createPost(createDto, adminId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Blog post created successfully',
      data: post,
    };
  }

  /**
   * Update existing blog post
   */
  @Patch('posts/:id')
  @AdminOrAbove()
  @AdminAction('blog.update', 'content')
  async updatePost(
    @Param('id') id: string,
    @Body() updateDto: UpdateBlogPostDto,
  ) {
    const post = await this.adminBlogService.updatePost(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post updated successfully',
      data: post,
    };
  }

  /**
   * Publish a draft post
   */
  @Post('posts/:id/publish')
  @AdminOrAbove()
  @AdminAction('blog.publish', 'content')
  async publishPost(@Param('id') id: string) {
    const post = await this.adminBlogService.publishPost(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post published successfully',
      data: post,
    };
  }

  /**
   * Unpublish a post (revert to draft)
   */
  @Post('posts/:id/unpublish')
  @AdminOrAbove()
  @AdminAction('blog.unpublish', 'content')
  async unpublishPost(@Param('id') id: string) {
    const post = await this.adminBlogService.unpublishPost(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post unpublished successfully',
      data: post,
    };
  }

  /**
   * Soft delete a blog post
   */
  @Delete('posts/:id')
  @AdminOrAbove()
  @AdminAction('blog.delete', 'content')
  async deletePost(@Param('id') id: string) {
    const result = await this.adminBlogService.deletePost(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Restore a soft-deleted post
   */
  @Post('posts/:id/restore')
  @AdminOrAbove()
  @AdminAction('blog.restore', 'content')
  async restorePost(@Param('id') id: string) {
    const post = await this.adminBlogService.restorePost(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post restored successfully',
      data: post,
    };
  }

  /**
   * Upload image for blog content
   */
  @Post('upload-image')
  @AdminOrAbove()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/blog',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `blog-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Allow only images
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          callback(new Error('Only image files are allowed'), false);
        } else {
          callback(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No image file provided',
      };
    }

    // Return the file path that can be used in blog content
    const imagePath = `/uploads/blog/${file.filename}`;

    return {
      statusCode: HttpStatus.OK,
      message: 'Image uploaded successfully',
      data: {
        url: imagePath,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }
}
