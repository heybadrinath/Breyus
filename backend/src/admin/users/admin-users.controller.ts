import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminUsersService } from './admin-users.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
// SECURITY FIX: Import RBAC guards and decorators (Audit Bug - IDOR)
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { RequireRole, SuperAdminOnly, AdminOrAbove, AnyAdmin } from '../auth/decorators/require-role.decorator';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import { GetUsersQueryDto, UpdateUserDto, SuspendUserDto } from './dto';

@Controller('admin/users')
@UseGuards(AdminAuthGuard, AdminRolesGuard)  // SECURITY FIX: Added AdminRolesGuard (Audit Bug - IDOR)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * Get paginated list of users with filters
   * GET /admin/users?page=1&limit=20&search=&role=&isSuspended=
   */
  @Get()
  @AnyAdmin()  // RBAC: All admin roles can view
  @AdminAction({ action: 'user.list', category: 'users' })
  async getUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.adminUsersService.getUsers(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  /**
   * Get page-level stats for KPI cards
   * GET /admin/users/stats
   */
  @Get('stats')
  @AnyAdmin()  // RBAC: All admin roles can view stats
  async getPageStats() {
    const stats = await this.adminUsersService.getPageStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'User page stats retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get user by ID with company info
   * GET /admin/users/:id
   */
  @Get(':id')
  @AnyAdmin()  // RBAC: All admin roles can view
  @AdminAction({ action: 'user.view', category: 'users' })
  async getUserById(@Param('id') id: string) {
    const user = await this.adminUsersService.getUserById(id);
    const stats = await this.adminUsersService.getUserStats(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: { user, stats },
    };
  }

  /**
   * Update user fields
   * PATCH /admin/users/:id
   */
  @Patch(':id')
  @AdminOrAbove()  // RBAC: super_admin and admin only (viewer cannot modify)
  @AdminAction({ action: 'user.update', category: 'users' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const user = await this.adminUsersService.updateUser(
      id,
      updateDto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  /**
   * Delete user
   * DELETE /admin/users/:id
   */
  @Delete(':id')
  @SuperAdminOnly()  // RBAC: Only super_admin can delete users (destructive action)
  @AdminAction({ action: 'user.delete', category: 'users' })
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    await this.adminUsersService.deleteUser(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
    };
  }

  /**
   * Suspend user
   * POST /admin/users/:id/suspend
   */
  @Post(':id/suspend')
  @AdminOrAbove()  // RBAC: super_admin and admin can suspend
  @AdminAction({ action: 'user.suspend', category: 'users' })
  async suspendUser(
    @Param('id') id: string,
    @Body() suspendDto: SuspendUserDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const user = await this.adminUsersService.suspendUser(
      id,
      suspendDto.reason,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User suspended successfully',
      data: user,
    };
  }

  /**
   * Unsuspend user
   * POST /admin/users/:id/unsuspend
   */
  @Post(':id/unsuspend')
  @AdminOrAbove()  // RBAC: super_admin and admin can unsuspend
  @AdminAction({ action: 'user.unsuspend', category: 'users' })
  async unsuspendUser(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    const user = await this.adminUsersService.unsuspendUser(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User unsuspended successfully',
      data: user,
    };
  }

  /**
   * Force password reset
   * POST /admin/users/:id/reset-password
   */
  @Post(':id/reset-password')
  @AdminOrAbove()  // RBAC: super_admin and admin can trigger password reset
  @AdminAction({ action: 'user.force_password_reset', category: 'users' })
  async forcePasswordReset(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    await this.adminUsersService.forcePasswordReset(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset initiated successfully. User will receive an email with reset instructions.',
    };
  }

  /**
   * Export user data (GDPR)
   * GET /admin/users/:id/export
   */
  @Get(':id/export')
  @AdminOrAbove()  // RBAC: super_admin and admin can export (contains sensitive data)
  @AdminAction({ action: 'user.export_data', category: 'users' })
  async exportUserData(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const exportData = await this.adminUsersService.exportUserData(id);

    // Log the export action
    // Note: Activity is already logged by the decorator, but we can add extra context

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-${id}-${Date.now()}.json"`,
    );

    return res.status(HttpStatus.OK).json(exportData);
  }
}
