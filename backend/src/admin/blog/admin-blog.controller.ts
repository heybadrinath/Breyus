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
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminBlogService } from './admin-blog.service';
import { NewsletterService } from '../../blog/newsletter.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateBlogPostDto } from '../../blog/dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../../blog/dto/update-blog-post.dto';
import { AdminBlogQueryDto } from '../../blog/dto/blog-query.dto';
import { AdminSubscriberQueryDto } from '../../blog/dto/newsletter.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import {
  AnyAdmin,
  AdminOrAbove,
} from '../auth/decorators/require-role.decorator';
import { AdminAction } from '../activity/admin-action.decorator';
import {
  validateImageSignature,
  generateUniqueFilename,
} from '../../common/utils/file-validation.util';

/**
 * AdminBlogController handles admin CRUD operations for blog posts
 *
 * Routes (all prefixed with /admin/blog):
 * - GET /posts - List all posts with filters
 * - GET /posts/pending-review - List posts awaiting review
 * - GET /posts/:id - Get single post
 * - POST /posts - Create new post
 * - PATCH /posts/:id - Update post
 * - DELETE /posts/:id - Soft delete post
 * - POST /posts/:id/publish - Publish approved/draft
 * - POST /posts/:id/unpublish - Revert to draft
 * - POST /posts/:id/approve - Approve submitted post
 * - POST /posts/:id/reject - Reject submitted post
 * - POST /posts/:id/request-revision - Request changes
 * - POST /posts/:id/toggle-featured - Toggle featured status
 * - POST /posts/:id/toggle-pinned - Toggle pinned status
 * - PATCH /posts/:id/access-level - Update access level
 * - POST /posts/:id/restore - Restore deleted post
 * - POST /upload-image - Upload blog image
 * - GET /stats - Get blog statistics
 * - GET /writers - List all writers
 * - DELETE /writers/:id - Remove writer status
 * - GET /invites - List all invites
 * - POST /invites - Create new invite
 * - DELETE /invites/:id - Revoke invite
 * - GET /comments - List comments with moderation filters
 * - GET /comments/stats - Get comment moderation statistics
 * - PATCH /comments/:id - Update comment (hide/unhide)
 * - POST /comments/:id/clear-flags - Clear all flags from comment
 * - DELETE /comments/:id - Delete comment
 * - GET /analytics/overview - Get analytics overview
 * - GET /analytics/posts - Get post performance
 * - GET /analytics/writers - Get writer performance
 * - GET /analytics/categories - Get category performance
 */
@Controller('admin/blog')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminBlogController {
  constructor(
    private readonly adminBlogService: AdminBlogService,
    private readonly newsletterService: NewsletterService,
    private readonly storageService: StorageService,
  ) {}

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
   * Check if a slug is available (not already in use)
   * Fix: Client-side validation to prevent duplicate slug errors
   */
  @Get('posts/check-slug')
  @AnyAdmin()
  async checkSlugAvailability(
    @Query('slug') slug: string,
    @Query('excludePostId') excludePostId?: string,
  ) {
    const result = await this.adminBlogService.checkSlugAvailability(
      slug,
      excludePostId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Slug availability checked',
      data: result,
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
   * Get posts pending review
   * Restricted to admin/superadmin roles - pending content may contain
   * unreviewed material not suitable for all staff to view
   */
  @Get('posts/pending-review')
  @AdminOrAbove()
  async getPendingReviewPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.adminBlogService.getPendingReviewPosts({
      page,
      limit,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Pending review posts retrieved successfully',
      data: result,
    };
  }

  /**
   * Approve a submitted post
   */
  @Post('posts/:id/approve')
  @AdminOrAbove()
  @AdminAction('blog.approve', 'content')
  async approvePost(@Param('id') id: string, @Req() req: any) {
    const adminId = req.admin._id.toString();
    const post = await this.adminBlogService.approvePost(id, adminId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post approved successfully',
      data: post,
    };
  }

  /**
   * Reject a submitted post
   */
  @Post('posts/:id/reject')
  @AdminOrAbove()
  @AdminAction('blog.reject', 'content')
  async rejectPost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const post = await this.adminBlogService.rejectPost(id, adminId, reason);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog post rejected',
      data: post,
    };
  }

  /**
   * Request revision on a submitted post
   */
  @Post('posts/:id/request-revision')
  @AdminOrAbove()
  @AdminAction('blog.request-revision', 'content')
  async requestRevision(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const post = await this.adminBlogService.requestRevision(
      id,
      adminId,
      notes,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Revision requested',
      data: post,
    };
  }

  /**
   * Toggle featured status
   */
  @Post('posts/:id/toggle-featured')
  @AdminOrAbove()
  @AdminAction('blog.toggle-featured', 'content')
  async toggleFeatured(@Param('id') id: string) {
    const post = await this.adminBlogService.toggleFeatured(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Featured status toggled',
      data: post,
    };
  }

  /**
   * Toggle pinned status
   */
  @Post('posts/:id/toggle-pinned')
  @AdminOrAbove()
  @AdminAction('blog.toggle-pinned', 'content')
  async togglePinned(@Param('id') id: string) {
    const post = await this.adminBlogService.togglePinned(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pinned status toggled',
      data: post,
    };
  }

  /**
   * Update access level
   */
  @Patch('posts/:id/access-level')
  @AdminOrAbove()
  @AdminAction('blog.update-access', 'content')
  async updateAccessLevel(
    @Param('id') id: string,
    @Body('accessLevel') accessLevel: 'public' | 'member_only',
  ) {
    const post = await this.adminBlogService.updateAccessLevel(id, accessLevel);
    return {
      statusCode: HttpStatus.OK,
      message: 'Access level updated',
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
   *
   * Security features:
   * - MIME type validation (via multer fileFilter)
   * - Magic bytes validation (file signature check)
   * - Filename sanitization (prevents path traversal)
   * - Unique filename generation (prevents conflicts)
   * - Error messages don't expose internal paths
   *
   * Uses StorageService to support both local storage (dev) and S3/Spaces (production)
   * Set STORAGE_PROVIDER=s3 in production to use DigitalOcean Spaces
   */
  @Post('upload-image')
  @AdminOrAbove()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(), // Keep file in memory buffer for cloud upload
      fileFilter: (req, file, callback) => {
        // Allow only images (first layer - MIME type check)
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
      throw new BadRequestException('No image file provided');
    }

    // Second layer - validate file signature (magic bytes)
    // This prevents attacks where malicious files are renamed to .jpg
    const signatureValidation = validateImageSignature(
      file.buffer,
      file.mimetype,
    );
    if (!signatureValidation.isValid) {
      throw new BadRequestException(
        'Invalid image file. The file content does not match a valid image format.',
      );
    }

    // Generate a unique, sanitized filename to prevent:
    // - Path traversal attacks (../../../etc/passwd)
    // - Filename conflicts
    // - Special character injection
    const safeFilename = generateUniqueFilename(file.originalname);

    try {
      // Upload using StorageService (respects STORAGE_PROVIDER env var)
      // - STORAGE_PROVIDER=local → saves to ./uploads/blog/
      // - STORAGE_PROVIDER=s3 → uploads to S3/Spaces bucket
      const url = await this.storageService.upload(
        file.buffer,
        safeFilename,
        'blog', // folder/prefix
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Image uploaded successfully',
        data: {
          url,
          originalName: file.originalname,
          storedName: safeFilename,
          size: file.size,
          mimeType: file.mimetype,
        },
      };
    } catch (error) {
      // Don't expose internal error details to client
      console.error('Image upload failed:', error.message);
      throw new BadRequestException(
        'Failed to upload image. Please try again or contact support if the issue persists.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Writer Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all writers with post statistics
   */
  @Get('writers')
  @AnyAdmin()
  async getWriters() {
    const result = await this.adminBlogService.getWriters();
    return {
      statusCode: HttpStatus.OK,
      message: 'Writers retrieved successfully',
      data: result,
    };
  }

  /**
   * Remove writer status from a user
   */
  @Delete('writers/:id')
  @AdminOrAbove()
  @AdminAction('blog.remove-writer', 'content')
  async removeWriter(@Param('id') id: string) {
    const result = await this.adminBlogService.removeWriter(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Invite Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all writer invites
   */
  @Get('invites')
  @AnyAdmin()
  async getWriterInvites() {
    const result = await this.adminBlogService.getWriterInvites();
    return {
      statusCode: HttpStatus.OK,
      message: 'Invites retrieved successfully',
      data: result,
    };
  }

  /**
   * Create a new writer invite
   */
  @Post('invites')
  @AdminOrAbove()
  @AdminAction('blog.create-invite', 'content')
  async createWriterInvite(
    @Body() body: { emailHint?: string; adminNote?: string },
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const invite = await this.adminBlogService.createWriterInvite(
      adminId,
      body,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Invite created successfully',
      data: invite,
    };
  }

  /**
   * Revoke a writer invite
   */
  @Delete('invites/:id')
  @AdminOrAbove()
  @AdminAction('blog.revoke-invite', 'content')
  async revokeWriterInvite(@Param('id') id: string) {
    const result = await this.adminBlogService.revokeWriterInvite(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Comment Moderation
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all comments with moderation filters
   */
  @Get('comments')
  @AnyAdmin()
  async getComments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('flagged') flagged?: string,
    @Query('hidden') hidden?: string,
  ) {
    const result = await this.adminBlogService.getComments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      flagged: flagged === 'true',
      hidden: hidden === 'true',
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Comments retrieved successfully',
      data: result,
    };
  }

  /**
   * Get comment moderation statistics
   */
  @Get('comments/stats')
  @AnyAdmin()
  async getCommentStats() {
    const stats = await this.adminBlogService.getCommentStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Comment stats retrieved successfully',
      data: stats,
    };
  }

  /**
   * Update a comment (hide/unhide)
   */
  @Patch('comments/:id')
  @AdminOrAbove()
  @AdminAction('blog.moderate-comment', 'content')
  async updateComment(
    @Param('id') id: string,
    @Body() body: { isHidden?: boolean },
  ) {
    const comment = await this.adminBlogService.updateComment(id, body);
    return {
      statusCode: HttpStatus.OK,
      message: 'Comment updated successfully',
      data: comment,
    };
  }

  /**
   * Clear all flags from a comment
   */
  @Post('comments/:id/clear-flags')
  @AdminOrAbove()
  @AdminAction('blog.clear-comment-flags', 'content')
  async clearCommentFlags(@Param('id') id: string) {
    const comment = await this.adminBlogService.clearCommentFlags(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Flags cleared successfully',
      data: comment,
    };
  }

  /**
   * Delete a comment
   */
  @Delete('comments/:id')
  @AdminOrAbove()
  @AdminAction('blog.delete-comment', 'content')
  async deleteComment(@Param('id') id: string) {
    const result = await this.adminBlogService.deleteComment(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Analytics
  // ─────────────────────────────────────────────────────────────

  /**
   * Get analytics overview with trends
   */
  @Get('analytics/overview')
  @AnyAdmin()
  async getAnalyticsOverview(@Query('period') period: string = '30d') {
    const stats = await this.adminBlogService.getAnalyticsOverview(period);
    return {
      statusCode: HttpStatus.OK,
      message: 'Analytics overview retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get post performance analytics
   */
  @Get('analytics/posts')
  @AnyAdmin()
  async getPostPerformance(
    @Query('period') period: string = '30d',
    @Query('sort') sort: string = 'views',
  ) {
    const posts = await this.adminBlogService.getPostPerformance(period, sort);
    return {
      statusCode: HttpStatus.OK,
      message: 'Post performance retrieved successfully',
      data: posts,
    };
  }

  /**
   * Get writer performance analytics
   */
  @Get('analytics/writers')
  @AnyAdmin()
  async getWriterPerformance(@Query('period') period: string = '30d') {
    const writers = await this.adminBlogService.getWriterPerformance(period);
    return {
      statusCode: HttpStatus.OK,
      message: 'Writer performance retrieved successfully',
      data: writers,
    };
  }

  /**
   * Get category performance analytics
   */
  @Get('analytics/categories')
  @AnyAdmin()
  async getCategoryPerformance(@Query('period') period: string = '30d') {
    const categories =
      await this.adminBlogService.getCategoryPerformance(period);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category performance retrieved successfully',
      data: categories,
    };
  }

  // ============================================
  // BLOG USERS MANAGEMENT
  // ============================================

  /**
   * Get blog users statistics
   */
  @Get('users/stats')
  @AnyAdmin()
  async getBlogUsersStats() {
    const stats = await this.adminBlogService.getBlogUsersStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog users stats retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get all blog users with filters
   */
  @Get('users')
  @AnyAdmin()
  @AdminAction('blog.users.list', 'user')
  async getBlogUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('isBrèyusMember') isBrèyusMember?: string,
    @Query('isWriter') isWriter?: string,
    @Query('isSuspended') isSuspended?: string,
  ) {
    const result = await this.adminBlogService.getBlogUsers({
      page,
      limit,
      search,
      isBrèyusMember:
        isBrèyusMember === 'true'
          ? true
          : isBrèyusMember === 'false'
            ? false
            : undefined,
      isWriter:
        isWriter === 'true' ? true : isWriter === 'false' ? false : undefined,
      isSuspended:
        isSuspended === 'true'
          ? true
          : isSuspended === 'false'
            ? false
            : undefined,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog users retrieved successfully',
      data: result,
    };
  }

  /**
   * Get single blog user by ID
   */
  @Get('users/:id')
  @AnyAdmin()
  @AdminAction('blog.users.view', 'user')
  async getBlogUser(@Param('id') userId: string) {
    const result = await this.adminBlogService.getBlogUser(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Blog user retrieved successfully',
      data: result,
    };
  }

  /**
   * Suspend a blog user
   */
  @Patch('users/:id/suspend')
  @AdminOrAbove()
  @AdminAction('blog.users.suspend', 'user')
  async suspendBlogUser(
    @Param('id') userId: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    const adminId = req.admin?._id?.toString() || 'unknown';
    const result = await this.adminBlogService.suspendBlogUser(
      userId,
      adminId,
      reason,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
    };
  }

  /**
   * Unsuspend a blog user
   */
  @Patch('users/:id/unsuspend')
  @AdminOrAbove()
  @AdminAction('blog.users.unsuspend', 'user')
  async unsuspendBlogUser(@Param('id') userId: string) {
    const result = await this.adminBlogService.unsuspendBlogUser(userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
    };
  }

  /**
   * Promote a user to writer
   */
  @Patch('users/:id/promote-writer')
  @AdminOrAbove()
  @AdminAction('blog.users.promote-writer', 'user')
  async promoteToWriter(@Param('id') userId: string) {
    const user = await this.adminBlogService.promoteToWriter(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'User promoted to writer successfully',
      data: user,
    };
  }

  /**
   * Revoke writer status from a user
   */
  @Patch('users/:id/revoke-writer')
  @AdminOrAbove()
  @AdminAction('blog.users.revoke-writer', 'user')
  async revokeWriterStatus(@Param('id') userId: string) {
    const user = await this.adminBlogService.revokeWriterStatus(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Writer status revoked successfully',
      data: user,
    };
  }

  /**
   * Soft delete a blog user
   */
  @Delete('users/:id')
  @AdminOrAbove()
  @AdminAction('blog.users.delete', 'user')
  async deleteBlogUser(@Param('id') userId: string) {
    const result = await this.adminBlogService.deleteBlogUser(userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
    };
  }

  // ============================================
  // NEWSLETTER SUBSCRIBERS MANAGEMENT
  // ============================================

  /**
   * Get newsletter subscriber statistics
   */
  @Get('subscribers/stats')
  @AnyAdmin()
  async getSubscriberStats() {
    const stats = await this.newsletterService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscriber stats retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get paginated list of newsletter subscribers
   */
  @Get('subscribers')
  @AnyAdmin()
  @AdminAction('blog.subscribers.list', 'content')
  async getSubscribers(@Query() query: AdminSubscriberQueryDto) {
    const result = await this.newsletterService.getSubscribers(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscribers retrieved successfully',
      data: result,
    };
  }

  /**
   * Export subscribers as CSV file
   */
  @Get('subscribers/export')
  @AdminOrAbove()
  @AdminAction('blog.subscribers.export', 'content')
  async exportSubscribers(@Res() res: any) {
    const csv = await this.newsletterService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=newsletter-subscribers.csv',
    );
    return res.send(csv);
  }

  /**
   * Manually trigger weekly digest (for testing or ad-hoc sends)
   */
  @Post('subscribers/send-digest')
  @AdminOrAbove()
  @AdminAction('blog.subscribers.send-digest', 'content')
  async sendDigestNow() {
    const result = await this.newsletterService.sendWeeklyDigest();
    return {
      statusCode: HttpStatus.OK,
      message: `Digest sent to ${result.sent} subscribers`,
      data: result,
    };
  }

  /**
   * Unsubscribe a user (admin action)
   */
  @Delete('subscribers/:id')
  @AdminOrAbove()
  @AdminAction('blog.subscribers.remove', 'content')
  async removeSubscriber(@Param('id') id: string) {
    const result = await this.newsletterService.removeSubscriber(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
