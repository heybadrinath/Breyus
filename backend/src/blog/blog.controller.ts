import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BlogService } from './blog.service';
import { PublicBlogQueryDto, PersonalizedBlogQueryDto } from './dto/blog-query.dto';

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
 */
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

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
  async getPosts(@Query() query: PublicBlogQueryDto, @Res() response: Response) {
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
        result = await this.blogService.getPersonalizedPosts(accountToken, query);
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
   */
  @Get('posts/:slug')
  async getPostBySlug(@Param('slug') slug: string, @Res() response: Response) {
    try {
      const post = await this.blogService.getPostBySlug(slug);
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
}
