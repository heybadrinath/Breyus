import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';

/**
 * BlogModule provides public-facing blog functionality
 *
 * Features:
 * - Public blog post listing with pagination
 * - Personalized posts based on user interests
 * - Category and tag aggregations
 * - View count tracking
 *
 * Note: Admin CRUD operations are in AdminBlogModule (admin/blog/)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
    ]),
    // Import ProductsModule to access Product model for interest matching
    forwardRef(() => ProductsModule),
    // Import AuthModule for token validation
    forwardRef(() => AuthModule),
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService, MongooseModule],
})
export class BlogModule {}
