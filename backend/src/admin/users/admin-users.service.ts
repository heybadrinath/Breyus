import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../users/user.schema';
import { Company } from '../../company/company.schema';
import { Trade } from '../../trade/schema/trade.schema';
import { Product } from '../../products/schema/products.schema';
import { Wishlist } from '../../wishlist/wishlist.schema';
import { Notification } from '../../notification/schema/notification.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from '../../mail/mail.service';
import { NotificationService } from '../../notification/notification.service';
import { ActivityLogService } from '../activity/activity-log.service';

export interface PaginatedUsersResult {
  users: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalTrades: number;
  activeTrades: number;
  completedTrades: number;
}

export interface UserPageStats {
  total: number;
  totalChange?: number;
  active: number;
  activeChange?: number;
  suspended: number;
  suspendedChange?: number;
  newThisMonth: number;
  newThisMonthChange?: number;
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get paginated list of users with filters
   */
  async getUsers(query: GetUsersQueryDto): Promise<PaginatedUsersResult> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isSuspended,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const filter: any = {};

    // Search by email
    if (search) {
      filter.mail = { $regex: search, $options: 'i' };
    }

    // Filter by role (map display role to internal role)
    if (role) {
      filter.role = role === 'Buyer' ? 'admin' : 'user';
    }

    // Filter by suspension status
    if (typeof isSuspended === 'boolean') {
      filter.isSuspended = isSuspended;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('company', 'companyName role isVerified')
        .select('-password -passwordResetToken -passwordResetExpires')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Map role for display
    const mappedUsers = users.map((user) => ({
      ...user,
      displayRole: user.role === 'Buyer' ? 'Buyer' : 'Seller',
    }));

    return {
      users: mappedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user by ID with company info
   */
  async getUserById(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(userId)
      .populate('company')
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      displayRole: user.role === 'Buyer' ? 'Buyer' : 'Seller',
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).select('company').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const companyId = user.company;

    // Count trades where user's company is either buyer or seller
    const [totalTrades, activeTrades, completedTrades] = await Promise.all([
      this.tradeModel.countDocuments({
        $or: [{ buyer: companyId }, { seller: companyId }],
      }),
      this.tradeModel.countDocuments({
        $or: [{ buyer: companyId }, { seller: companyId }],
        status: { $in: ['pending', 'accepted', 'in_progress'] },
      }),
      this.tradeModel.countDocuments({
        $or: [{ buyer: companyId }, { seller: companyId }],
        status: 'completed',
      }),
    ]);

    return {
      totalTrades,
      activeTrades,
      completedTrades,
    };
  }

  /**
   * Get page-level statistics for the Users page KPI cards
   */
  async getPageStats(): Promise<UserPageStats> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Current period stats
    const [total, active, suspended, newThisMonth] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isSuspended: { $ne: true } }),
      this.userModel.countDocuments({ isSuspended: true }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
    ]);

    // Previous period stats for comparison
    const [
      totalLastMonth,
      activeLastMonth,
      suspendedLastMonth,
      newLastMonth,
    ] = await Promise.all([
      this.userModel.countDocuments({ createdAt: { $lt: startOfThisMonth } }),
      this.userModel.countDocuments({
        isSuspended: { $ne: true },
        createdAt: { $lt: startOfThisMonth },
      }),
      this.userModel.countDocuments({
        isSuspended: true,
        createdAt: { $lt: startOfThisMonth },
      }),
      this.userModel.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number | undefined => {
      if (previous === 0) return current > 0 ? 100 : undefined;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      total,
      totalChange: calculateChange(total, totalLastMonth),
      active,
      activeChange: calculateChange(active, activeLastMonth),
      suspended,
      suspendedChange: calculateChange(suspended, suspendedLastMonth),
      newThisMonth,
      newThisMonthChange: calculateChange(newThisMonth, newLastMonth),
    };
  }

  /**
   * Update user fields
   */
  async updateUser(
    userId: string,
    updateDto: UpdateUserDto,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already taken by another user
    if (updateDto.mail && updateDto.mail !== user.mail) {
      const existingUser = await this.userModel.findOne({
        mail: updateDto.mail,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    const previousValue = {
      mail: user.mail,
      role: user.role,
    };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateDto }, { new: true })
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'user.update',
      actionCategory: 'users',
      targetType: 'user',
      targetId: new Types.ObjectId(userId),
      targetIdentifier: user.mail,
      description: `Updated user ${user.mail}`,
      previousValue,
      newValue: updateDto,
      metadata: {},
    });

    return {
      ...updatedUser,
      displayRole: updatedUser?.role === 'Buyer' ? 'Buyer' : 'Seller',
    };
  }

  /**
   * Delete user with cascade cleanup
   * Bug #6 Fix: Properly handles related data to prevent orphaned records
   */
  async deleteUser(
    userId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    // ═══════════════════════════════════════════════════════════════
    // CASCADE DELETE - Bug #6 Fix
    // ═══════════════════════════════════════════════════════════════

    // 1. Soft-delete trades where user is buyer or seller
    // We keep the trade record for audit purposes but mark the participant as deleted
    const buyerTradesUpdated = await this.tradeModel.updateMany(
      { buyer: userObjectId },
      { $set: { buyerDeleted: true, buyerDeletedAt: new Date() } },
    );
    const sellerTradesUpdated = await this.tradeModel.updateMany(
      { seller: userObjectId },
      { $set: { sellerDeleted: true, sellerDeletedAt: new Date() } },
    );
    const tradesAffected = {
      modifiedCount: buyerTradesUpdated.modifiedCount + sellerTradesUpdated.modifiedCount,
    };

    // 2. Deactivate products owned by the user (soft delete - preserves trade history)
    const productsDeactivated = await this.productModel.updateMany(
      { userId: userId },
      { $set: { isActive: false, ownerDeleted: true, ownerDeletedAt: new Date() } },
    );

    // 3. Delete wishlist items for the user (hard delete - no audit needed)
    const wishlistDeleted = await this.wishlistModel.deleteMany({ user: userObjectId });

    // 4. Delete notifications for the user (hard delete - no audit needed)
    const notificationsDeleted = await this.notificationModel.deleteMany({ userId: userObjectId });

    // 5. Remove user from company's users array
    await this.companyModel.updateOne(
      { _id: user.company },
      { $pull: { users: userId } },
    );

    // 6. Delete the user record
    await this.userModel.findByIdAndDelete(userId);

    // Log the action with cascade delete details
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'user.delete',
      actionCategory: 'users',
      targetType: 'user',
      targetId: userObjectId,
      targetIdentifier: user.mail,
      description: `Deleted user ${user.mail} with cascade cleanup`,
      previousValue: { mail: user.mail, role: user.role },
      newValue: undefined,
      metadata: {
        cascadeResults: {
          tradesMarkedDeleted: tradesAffected.modifiedCount,
          productsDeactivated: productsDeactivated.modifiedCount,
          wishlistItemsDeleted: wishlistDeleted.deletedCount,
          notificationsDeleted: notificationsDeleted.deletedCount,
        },
      },
    });
  }

  /**
   * Suspend user
   */
  async suspendUser(
    userId: string,
    reason: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isSuspended) {
      throw new BadRequestException('User is already suspended');
    }

    const previousValue = {
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: null,
      suspendedBy: null,
    };

    const newValue = {
      isSuspended: true,
      suspendedAt: new Date(),
      suspensionReason: reason,
      suspendedBy: new Types.ObjectId(adminId),
    };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: newValue }, { new: true })
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();

    // Send notification to user
    await this.notificationService.createNotification({
      userId: userId,
      type: 'account_suspended',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`,
      priority: 'urgent',
    });

    // Send email notification
    try {
      await this.mailService.sendTradeNotificationEmail(
        user.mail,
        'Account Suspended - Breyus',
        `<h2>Account Suspended</h2>
        <p>Your Breyus account has been suspended.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this is an error, please contact our support team for assistance.</p>`,
      );
    } catch (error) {
      console.error('Failed to send suspension email:', error);
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'user.suspend',
      actionCategory: 'users',
      targetType: 'user',
      targetId: new Types.ObjectId(userId),
      targetIdentifier: user.mail,
      description: `Suspended user ${user.mail}. Reason: ${reason}`,
      previousValue,
      newValue,
      metadata: {},
    });

    return {
      ...updatedUser,
      displayRole: updatedUser?.role === 'Buyer' ? 'Buyer' : 'Seller',
    };
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(
    userId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isSuspended) {
      throw new BadRequestException('User is not suspended');
    }

    const previousValue = {
      isSuspended: true,
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
      suspendedBy: user.suspendedBy,
    };

    const newValue = {
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: null,
      suspendedBy: null,
    };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: newValue }, { new: true })
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();

    // Send notification to user
    await this.notificationService.createNotification({
      userId: userId,
      type: 'account_unsuspended',
      title: 'Account Reactivated',
      message: 'Your account has been reactivated. You can now log in and use the platform.',
      priority: 'high',
    });

    // Send email notification
    try {
      await this.mailService.sendTradeNotificationEmail(
        user.mail,
        'Account Reactivated - Breyus',
        `<h2>Account Reactivated</h2>
        <p>Good news! Your Breyus account has been reactivated.</p>
        <p>You can now log in and use the platform as usual.</p>`,
      );
    } catch (error) {
      console.error('Failed to send unsuspension email:', error);
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'user.unsuspend',
      actionCategory: 'users',
      targetType: 'user',
      targetId: new Types.ObjectId(userId),
      targetIdentifier: user.mail,
      description: `Unsuspended user ${user.mail}`,
      previousValue,
      newValue,
      metadata: {},
    });

    return {
      ...updatedUser,
      displayRole: updatedUser?.role === 'Buyer' ? 'Buyer' : 'Seller',
    };
  }

  /**
   * Force password reset - sends OTP to user
   */
  async forcePasswordReset(
    userId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP and send email using existing flow
    const otp = this.mailService.generateOtp();
    await this.mailService.storeOtp(user.mail, otp);
    await this.mailService.sendPasswordResetEmail(user.mail, otp);

    // Send notification to user
    await this.notificationService.createNotification({
      userId: userId,
      type: 'password_reset_required',
      title: 'Password Reset Required',
      message: 'An administrator has initiated a password reset for your account. Please check your email for the reset code.',
      priority: 'urgent',
    });

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'user.force_password_reset',
      actionCategory: 'users',
      targetType: 'user',
      targetId: new Types.ObjectId(userId),
      targetIdentifier: user.mail,
      description: `Initiated password reset for user ${user.mail}`,
      previousValue: undefined,
      newValue: undefined,
      metadata: {},
    });
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(userId)
      .populate('company')
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's trades
    const trades = await this.tradeModel
      .find({
        $or: [{ buyer: user.company }, { seller: user.company }],
      })
      .select('-__v')
      .lean();

    // Build export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.mail,
        role: user.role === 'Buyer' ? 'Buyer' : 'Seller',
        createdAt: (user as any).createdAt,
        notificationPreferences: user.notificationPreferences,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
      },
      company: user.company,
      trades: trades.map((trade: any) => ({
        _id: trade._id,
        status: trade.negotiationStatus,
        phase: trade.tradePhase,
        createdAt: trade.createdAt,
        product: trade.product,
      })),
      tradeCount: trades.length,
    };

    return exportData;
  }
}
