import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly usersService: UsersService) {}

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    this.logger.log(`Changing password for user ${userId}`);
    
    // Get user with password
    const user = await this.usersService.findOneWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new BadRequestException('Current password is incorrect');
    }
    
    // Update password
    await this.usersService.updatePassword(userId, newPassword);
    
    return { message: 'Password updated successfully' };
  }

  async getSecurityInfo(userId: string): Promise<any> {
    this.logger.log(`Getting security info for user ${userId}`);
    
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Return security-related information
    return {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      lastPasswordChange: user.updatedAt,
    };
  }
} 