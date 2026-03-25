import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminBlogController } from './admin-blog.controller';
import { AdminBlogService } from './admin-blog.service';
import { BlogPost, BlogPostSchema } from '../../blog/schemas/blog-post.schema';
import {
  BlogUser,
  BlogUserSchema,
} from '../../blog-portal/schemas/blog-user.schema';
import {
  BlogWriterInvite,
  BlogWriterInviteSchema,
} from '../../blog-portal/schemas/blog-writer-invite.schema';
import {
  BlogComment,
  BlogCommentSchema,
} from '../../blog-portal/schemas/blog-comment.schema';
import {
  BlogLike,
  BlogLikeSchema,
} from '../../blog-portal/schemas/blog-like.schema';
import { BlogModule } from '../../blog/blog.module';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';

/**
 * AdminBlogModule provides admin CRUD operations for blog posts
 *
 * Features:
 * - Create/Update/Delete blog posts
 * - Publish/Unpublish workflow
 * - Image upload
 * - Statistics and analytics
 * - Comment moderation
 * - Writer management and invites
 * - Newsletter subscriber management
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: BlogUser.name, schema: BlogUserSchema },
      { name: BlogWriterInvite.name, schema: BlogWriterInviteSchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
      { name: BlogLike.name, schema: BlogLikeSchema },
    ]),
    // BlogModule exports NewsletterService which AdminBlogController needs
    forwardRef(() => BlogModule),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [AdminBlogController],
  providers: [AdminBlogService],
  exports: [AdminBlogService],
})
export class AdminBlogModule {}
