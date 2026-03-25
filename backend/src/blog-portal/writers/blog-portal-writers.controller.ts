import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BlogPortalWritersService } from './blog-portal-writers.service';

/**
 * BlogPortalWritersController handles public writer profiles
 *
 * Routes:
 * - GET /blog-portal/writers - List all active writers with stats
 * - GET /blog-portal/writers/:id - Get writer public profile
 * - GET /blog-portal/writers/:id/posts - Get writer's published posts
 */
@Controller('blog-portal/writers')
export class BlogPortalWritersController {
  constructor(private readonly writersService: BlogPortalWritersService) {}

  /**
   * List all active writers with stats
   */
  @Get()
  async getAllWriters(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.writersService.getAllWriters(
        page,
        limit,
        search,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Writers retrieved successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get writers',
      });
    }
  }

  /**
   * Get public writer profile
   */
  @Get(':id')
  async getWriterProfile(
    @Param('id') writerId: string,
    @Res() response: Response,
  ) {
    try {
      const writer = await this.writersService.getWriterProfile(writerId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Writer profile retrieved successfully',
        data: writer,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get writer profile',
      });
    }
  }

  /**
   * Get writer's published posts
   */
  @Get(':id/posts')
  async getWriterPosts(
    @Param('id') writerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() response: Response,
  ) {
    try {
      const result = await this.writersService.getWriterPosts(
        writerId,
        page,
        limit,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Writer posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to get writer posts',
      });
    }
  }
}
