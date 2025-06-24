import { Controller, Get, Post, Body, UseGuards, Request, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(private readonly securityService: SecurityService) {}

  @Get()
  async getSecurityInfo(@Request() req): Promise<any> {
    try {
      this.logger.log('GET /security request received');
      return await this.securityService.getSecurityInfo(req.user.id);
    } catch (error) {
      this.logger.error('Error in getSecurityInfo', error);
      throw new HttpException(
        'Failed to fetch security information',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('change-password')
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req
  ): Promise<{ message: string }> {
    try {
      this.logger.log('POST /security/change-password request received');
      return await this.securityService.changePassword(
        req.user.id,
        body.currentPassword,
        body.newPassword
      );
    } catch (error) {
      this.logger.error('Error in changePassword', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 