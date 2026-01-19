import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminBlogController } from './admin-blog.controller';
import { AdminBlogService } from './admin-blog.service';
import { BlogPost, BlogPostSchema } from '../../blog/schemas/blog-post.schema';
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
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
    ]),
    forwardRef(() => BlogModule),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [AdminBlogController],
  providers: [AdminBlogService],
  exports: [AdminBlogService],
})
export class AdminBlogModule {}
