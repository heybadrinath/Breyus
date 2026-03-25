import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterCronService } from './newsletter-cron.service';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';
import {
  NewsletterSubscriber,
  NewsletterSubscriberSchema,
} from './schemas/newsletter-subscriber.schema';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { MailModule } from '../mail/mail.module';

// Import blog portal schemas for member-only access validation
import {
  BlogSession,
  BlogSessionSchema,
} from '../blog-portal/schemas/blog-session.schema';
import {
  BlogUser,
  BlogUserSchema,
} from '../blog-portal/schemas/blog-user.schema';

// Import Trade and Wishlist schemas for enhanced personalization
import { Trade, TradeSchema } from '../trade/schema/trade.schema';
import { Wishlist, WishlistSchema } from '../wishlist/wishlist.schema';

/**
 * BlogModule provides public-facing blog functionality
 *
 * Features:
 * - Public blog post listing with pagination
 * - Personalized posts based on user interests
 * - Category and tag aggregations
 * - View count tracking
 * - Member-only content access control
 * - Newsletter subscription & weekly digest
 *
 * Note: Admin CRUD operations are in AdminBlogModule (admin/blog/)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      // Blog session and user for member-only validation
      { name: BlogSession.name, schema: BlogSessionSchema },
      { name: BlogUser.name, schema: BlogUserSchema },
      // Trade and Wishlist for enhanced blog personalization
      { name: Trade.name, schema: TradeSchema },
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    // Import ProductsModule to access Product model for interest matching
    forwardRef(() => ProductsModule),
    // Import AuthModule for token validation
    forwardRef(() => AuthModule),
    // Import MailModule for newsletter email sending
    MailModule,
  ],
  controllers: [BlogController],
  providers: [BlogService, NewsletterService, NewsletterCronService],
  exports: [BlogService, NewsletterService, MongooseModule],
})
export class BlogModule {}
