import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../activity/admin-action.decorator';
import { BlockIPDto, GetBlockedIPsQueryDto, GetFailedLoginsQueryDto } from './dto';

@Controller('admin/security')
@UseGuards(AdminAuthGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ============================================================================
  // BLOCKED IPs
  // ============================================================================

  @Get('blocked-ips')
  @AdminAction('security.view_blocked_ips', 'system')
  async getBlockedIPs(@Query() query: GetBlockedIPsQueryDto) {
    const blockedIPs = await this.securityService.getBlockedIPs(query.isActive);
    return {
      statusCode: 200,
      message: 'Blocked IPs retrieved successfully',
      data: blockedIPs,
    };
  }

  @Post('blocked-ips')
  @AdminAction('security.block_ip', 'system')
  async blockIP(@Body() dto: BlockIPDto, @Request() req) {
    const blockedIP = await this.securityService.blockIP(
      dto,
      req.admin._id.toString(),
      req.admin.email,
    );
    return {
      statusCode: 201,
      message: 'IP address blocked successfully',
      data: blockedIP,
    };
  }

  @Delete('blocked-ips/:id')
  @AdminAction('security.unblock_ip', 'system')
  async unblockIP(@Param('id') id: string, @Request() req) {
    await this.securityService.unblockIP(
      id,
      req.admin._id.toString(),
      req.admin.email,
    );
    return {
      statusCode: 200,
      message: 'IP address unblocked successfully',
    };
  }

  @Get('blocked-ips/check/:ipAddress')
  async checkIPBlocked(@Param('ipAddress') ipAddress: string) {
    const isBlocked = await this.securityService.isIPBlocked(ipAddress);
    return {
      statusCode: 200,
      message: 'IP check completed',
      data: { ipAddress, isBlocked },
    };
  }

  // ============================================================================
  // FAILED LOGIN ATTEMPTS
  // ============================================================================

  @Get('failed-logins')
  @AdminAction('security.view_failed_logins', 'system')
  async getFailedLogins(@Query() query: GetFailedLoginsQueryDto) {
    const result = await this.securityService.getFailedLogins(query);
    return {
      statusCode: 200,
      message: 'Failed login attempts retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('failed-logins/stats')
  @AdminAction('security.view_failed_login_stats', 'system')
  async getFailedLoginStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.securityService.getFailedLoginStats(start, end);
    return {
      statusCode: 200,
      message: 'Failed login statistics retrieved successfully',
      data: stats,
    };
  }
}
