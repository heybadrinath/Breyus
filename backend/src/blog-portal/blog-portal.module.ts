import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogAuthModule } from './auth/blog-auth.module';
import {
  BlogUser,
  BlogUserSchema,
  BlogSession,
  BlogSessionSchema,
  BlogComment,
  BlogCommentSchema,
  BlogLike,
  BlogLikeSchema,
  BlogWriterInvite,
  BlogWriterInviteSchema,
} from './schemas';

// Import BlogPost schema for interactions
import { BlogPost, BlogPostSchema } from '../blog/schemas/blog-post.schema';

// Posts module
import { BlogPortalPostsController } from './posts/blog-portal-posts.controller';
import { BlogPortalPostsService } from './posts/blog-portal-posts.service';

// Comments module
import { BlogPortalCommentsController } from './comments/blog-portal-comments.controller';
import { BlogPortalCommentsService } from './comments/blog-portal-comments.service';

// Writers module (public profiles)
import { BlogPortalWritersController } from './writers/blog-portal-writers.controller';
import { BlogPortalWritersService } from './writers/blog-portal-writers.service';

// Writer dashboard module
import { WriterDashboardController } from './writer-dashboard/writer-dashboard.controller';
import { WriterDashboardService } from './writer-dashboard/writer-dashboard.service';

// Invites module
import { BlogPortalInvitesController } from './invites/blog-portal-invites.controller';
import { BlogPortalInvitesService } from './invites/blog-portal-invites.service';

// Common services
import { StorageModule } from '../common/storage/storage.module';

/**
 * BlogPortalModule - Main Blog Portal Module
 *
 * Provides the complete blog portal functionality:
 * - Authentication (BlogAuthModule)
 * - Post interactions (likes, shares)
 * - Comments
 * - Public writer profiles
 * - Writer dashboard
 * - Writer invites
 *
 * This module is separate from the admin BlogModule which handles
 * content management.
 */
@Module({
  imports: [
    // Register all blog portal schemas
    MongooseModule.forFeature([
      { name: BlogUser.name, schema: BlogUserSchema },
      { name: BlogSession.name, schema: BlogSessionSchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
      { name: BlogLike.name, schema: BlogLikeSchema },
      { name: BlogWriterInvite.name, schema: BlogWriterInviteSchema },
      { name: BlogPost.name, schema: BlogPostSchema },
    ]),
    // Import auth module
    BlogAuthModule,
    // Import storage for image uploads
    StorageModule,
  ],
  controllers: [
    BlogPortalPostsController,
    BlogPortalCommentsController,
    BlogPortalWritersController,
    WriterDashboardController,
    BlogPortalInvitesController,
  ],
  providers: [
    BlogPortalPostsService,
    BlogPortalCommentsService,
    BlogPortalWritersService,
    WriterDashboardService,
    BlogPortalInvitesService,
  ],
  exports: [BlogAuthModule, MongooseModule],
})
export class BlogPortalModule {}
