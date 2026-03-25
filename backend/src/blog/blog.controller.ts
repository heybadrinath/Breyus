import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogService } from './blog.service';
import { NewsletterService } from './newsletter.service';
import {
  PublicBlogQueryDto,
  PersonalizedBlogQueryDto,
} from './dto/blog-query.dto';
import { SubscribeDto } from './dto/newsletter.dto';

/**
 * BlogController handles public blog endpoints
 * No authentication required - these are read-only public endpoints
 *
 * Routes:
 * - GET /blog/posts - List published posts
 * - GET /blog/posts/personalized - Get posts matching user interests
 * - GET /blog/posts/:slug - Get single post by slug
 * - GET /blog/categories - Get available categories
 * - GET /blog/tags/popular - Get popular tags
 * - POST /blog/subscribe - Subscribe to newsletter
 * - GET /blog/unsubscribe/:token - Unsubscribe from newsletter
 */
@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly newsletterService: NewsletterService,
  ) {}

  /**
   * Centralized error handler
   */
  private handleError(error: any, response: Response, context: string) {
    const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal server error';

    if (status >= 500) {
      console.error(`[BlogController] ${context}:`, {
        status,
        message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
    }

    return response.status(status).json({
      statusCode: status,
      message,
    });
  }

  /**
   * Get published blog posts with pagination and filters
   * Public endpoint - no auth required
   */
  @Get('posts')
  async getPosts(
    @Query() query: PublicBlogQueryDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.blogService.getPublishedPosts(query);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Blog posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, response, 'getPosts');
    }
  }

  /**
   * Get featured/hero post
   * Returns the most recent featured post, or falls back to pinned/most viewed
   */
  @Get('posts/featured')
  async getFeaturedPost(@Res() response: Response) {
    try {
      const post = await this.blogService.getFeaturedPost();
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Featured post retrieved successfully',
        data: { post },
      });
    } catch (error) {
      return this.handleError(error, response, 'getFeaturedPost');
    }
  }

  /**
   * Get all pinned posts for carousel display
   */
  @Get('posts/pinned')
  async getPinnedPosts(
    @Query('limit') limit: number = 10,
    @Res() response: Response,
  ) {
    try {
      const posts = await this.blogService.getPinnedPosts(limit);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Pinned posts retrieved successfully',
        data: { posts },
      });
    } catch (error) {
      return this.handleError(error, response, 'getPinnedPosts');
    }
  }

  /**
   * Get trending posts (sorted by view count)
   */
  @Get('posts/trending')
  async getTrendingPosts(
    @Query('limit') limit: number = 6,
    @Res() response: Response,
  ) {
    try {
      const posts = await this.blogService.getTrendingPosts(limit);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Trending posts retrieved successfully',
        data: { posts },
      });
    } catch (error) {
      return this.handleError(error, response, 'getTrendingPosts');
    }
  }

  /**
   * Search posts by query string
   */
  @Get('posts/search')
  async searchPosts(
    @Query('q') query: string,
    @Query('category') category: string,
    @Query('tag') tag: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() response: Response,
  ) {
    try {
      const result = await this.blogService.searchPosts(query, {
        category,
        tag,
        page,
        limit,
      });
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Search results retrieved successfully',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, response, 'searchPosts');
    }
  }

  /**
   * Get personalized blog posts based on user's product interests
   * Optionally uses auth cookie for personalization
   * Falls back to recent posts if no cookie/products
   */
  @Get('posts/personalized')
  async getPersonalizedPosts(
    @Query() query: PersonalizedBlogQueryDto,
    @Res() response: Response,
  ) {
    try {
      // Try to get account token from signed cookie (optional)
      const accountToken = response.req.signedCookies?.['account'];

      let result;
      if (accountToken) {
        result = await this.blogService.getPersonalizedPosts(
          accountToken,
          query,
        );
      } else {
        // No auth - return general posts
        result = await this.blogService.getPublishedPosts({
          page: query.page,
          limit: query.limit,
        });
      }

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Personalized blog posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, response, 'getPersonalizedPosts');
    }
  }

  /**
   * Get single blog post by slug
   * Increments view count
   *
   * Access Control:
   * - Public posts: Anyone can access
   * - Member-only posts: Requires blog_session cookie AND Breyus membership
   */
  @Get('posts/:slug')
  async getPostBySlug(@Param('slug') slug: string, @Res() response: Response) {
    try {
      // Extract blog session token from cookie (optional for member-only check)
      const sessionToken = response.req.cookies?.['blog_session'] || null;

      const post = await this.blogService.getPostBySlug(slug, sessionToken);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Blog post retrieved successfully',
        data: post,
      });
    } catch (error) {
      return this.handleError(error, response, 'getPostBySlug');
    }
  }

  /**
   * Get available blog categories with post counts
   */
  @Get('categories')
  async getCategories(@Res() response: Response) {
    try {
      const categories = await this.blogService.getCategories();
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      return this.handleError(error, response, 'getCategories');
    }
  }

  /**
   * Get popular tags
   */
  @Get('tags/popular')
  async getPopularTags(
    @Query('limit') limit: number = 20,
    @Res() response: Response,
  ) {
    try {
      const tags = await this.blogService.getPopularTags(limit);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Popular tags retrieved successfully',
        data: tags,
      });
    } catch (error) {
      return this.handleError(error, response, 'getPopularTags');
    }
  }

  /**
   * Get related posts for a given post
   */
  @Get('posts/:id/related')
  async getRelatedPosts(
    @Param('id') id: string,
    @Query('limit') limit: number = 4,
    @Res() response: Response,
  ) {
    try {
      const posts = await this.blogService.getRelatedPosts(id, limit);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Related posts retrieved successfully',
        data: posts,
      });
    } catch (error) {
      return this.handleError(error, response, 'getRelatedPosts');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Newsletter Subscription (Public)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get newsletter subscription status for a given email
   * Used by the settings page to show current toggle state
   */
  @Get('newsletter/status')
  async getNewsletterStatus(
    @Query('email') email: string,
    @Res() response: Response,
  ) {
    try {
      if (!email) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is required',
        });
      }
      const result = await this.newsletterService.getStatusByEmail(email);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Newsletter status retrieved',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, response, 'getNewsletterStatus');
    }
  }

  /**
   * Toggle newsletter subscription for an email
   * Used by the settings page enable/disable toggle
   */
  @Post('newsletter/toggle')
  async toggleNewsletter(
    @Body() body: { email: string; enabled: boolean },
    @Res() response: Response,
  ) {
    try {
      const result = await this.newsletterService.toggleByEmail(
        body.email,
        body.enabled,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.message,
        data: { enabled: body.enabled },
      });
    } catch (error) {
      return this.handleError(error, response, 'toggleNewsletter');
    }
  }

  /**
   * Subscribe to newsletter — no auth required
   */
  @Post('subscribe')
  async subscribe(
    @Body() subscribeDto: SubscribeDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.newsletterService.subscribe(
        subscribeDto.email,
        subscribeDto.source,
      );
      return response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: result.message,
      });
    } catch (error) {
      return this.handleError(error, response, 'subscribe');
    }
  }

  /**
   * Unsubscribe from newsletter via token link — no auth required
   * Returns HTML confirmation page
   */
  /**
   * Helper to escape HTML entities to prevent XSS
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  @Get('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Res() response: Response) {
    try {
      const result = await this.newsletterService.unsubscribe(token);
      // Fix: Escape message to prevent XSS
      const safeMessage = this.escapeHtml(result.message);
      const frontendUrl = this.escapeHtml(
        process.env.FRONTEND_URL || 'http://localhost:3000',
      );

      // Return a simple HTML page confirming unsubscription
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - Breyus</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { color: #1A1A2E; font-size: 24px; margin-bottom: 12px; }
    p { color: #4B5563; font-size: 16px; line-height: 1.6; }
    .accent { color: #B8860B; }
    a { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #1A1A2E; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    a:hover { background: #2a2a4e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>${safeMessage}</p>
    <p class="accent">We're sorry to see you go!</p>
    <a href="${frontendUrl}/blog">Back to Blog</a>
  </div>
</body>
</html>
      `;
      return response.status(HttpStatus.OK).type('html').send(html);
    } catch (error) {
      return this.handleError(error, response, 'unsubscribe');
    }
  }
}
