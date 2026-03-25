import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogPortalInvitesService } from './blog-portal-invites.service';
import { BlogAuthGuard } from '../auth/guards/blog-auth.guard';
import { BlogUserDecorator } from '../auth/decorators/blog-user.decorator';

/**
 * BlogPortalInvitesController handles writer invite validation and claiming
 *
 * Routes:
 * - GET /blog-portal/invite/:token/validate - Validate invite (public)
 * - POST /blog-portal/invite/:token/claim - Claim invite (auth required)
 */
@Controller('blog-portal/invite')
export class BlogPortalInvitesController {
  constructor(private readonly invitesService: BlogPortalInvitesService) {}

  /**
   * Validate an invite token (public)
   */
  @Get(':token/validate')
  async validateInvite(
    @Param('token') token: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.invitesService.validateInvite(token);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to validate invite',
      });
    }
  }

  /**
   * Claim an invite (auth required)
   */
  @Post(':token/claim')
  @UseGuards(BlogAuthGuard)
  async claimInvite(
    @Param('token') token: string,
    @BlogUserDecorator('_id') blogUserId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.invitesService.claimInvite(token, blogUserId);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        statusCode: status,
        message: error.message || 'Failed to claim invite',
      });
    }
  }
}
