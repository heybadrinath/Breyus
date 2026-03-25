import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, KycDocumentStatus } from '../../company/company.schema';
import { User } from '../../users/user.schema';
import { Trade } from '../../trade/schema/trade.schema';
import { Product } from '../../products/schema/products.schema';
import { Wishlist } from '../../wishlist/wishlist.schema';
import { Notification } from '../../notification/schema/notification.schema';
import { Conversation } from '../../inbox/schemas/conversations.schema';
import { Message } from '../../inbox/schemas/messages.schema';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { MailService } from '../../mail/mail.service';
import { NotificationService } from '../../notification/notification.service';
import { ActivityLogService } from '../activity/activity-log.service';

export interface PaginatedCompaniesResult {
  companies: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyStats {
  totalTrades: number;
  activeTrades: number;
  completedTrades: number;
  totalUsers: number;
  totalProducts: number;
}

export interface CompanyPageStats {
  total: number;
  totalChange?: number;
  verified: number;
  verifiedChange?: number;
  pending: number;
  pendingChange?: number;
  newThisMonth: number;
  newThisMonthChange?: number;
}

@Injectable()
export class AdminCompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get paginated list of companies with filters
   */
  async getCompanies(
    query: GetCompaniesQueryDto,
  ): Promise<PaginatedCompaniesResult> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isKycVerified,
      hasKycDocuments,
      gstPendingManualReview,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const filter: any = {};

    // Search by company name
    if (search) {
      filter.companyName = { $regex: search, $options: 'i' };
    }

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Filter by KYC verification status
    if (typeof isKycVerified === 'boolean') {
      filter.isKycVerified = isKycVerified;
    }

    // Filter by whether company has KYC documents
    if (typeof hasKycDocuments === 'boolean') {
      if (hasKycDocuments) {
        filter['kycDocuments.0'] = { $exists: true };
      } else {
        filter.$or = [
          { kycDocuments: { $exists: false } },
          { kycDocuments: { $size: 0 } },
        ];
      }
    }

    // Filter by GST pending manual review status
    if (typeof gstPendingManualReview === 'boolean') {
      filter.gstPendingManualReview = gstPendingManualReview;
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

    const [companies, total] = await Promise.all([
      this.companyModel
        .find(filter)
        .select('-bankInfo') // Don't expose bank info in list
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.companyModel.countDocuments(filter).exec(),
    ]);

    // Add user count and document stats for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const userCount = await this.userModel.countDocuments({
          company: company._id,
        });
        const kycDocuments = company.kycDocuments || [];
        const pendingDocs = kycDocuments.filter(
          (d: any) => d.status === KycDocumentStatus.PENDING,
        ).length;

        return {
          ...company,
          userCount,
          documentCount: kycDocuments.length,
          pendingDocumentCount: pendingDocs,
        };
      }),
    );

    return {
      companies: companiesWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get company by ID with users and documents
   */
  async getCompanyById(companyId: string): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean().exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Get company users
    const users = await this.userModel
      .find({ company: companyId })
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean()
      .exec();

    // Get trade stats
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
      ...company,
      users,
      stats: {
        totalTrades,
        activeTrades,
        completedTrades,
        userCount: users.length,
      },
    };
  }

  /**
   * Update company fields
   */
  async updateCompany(
    companyId: string,
    updateDto: UpdateCompanyDto,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const previousValue = {
      companyName: company.companyName,
      role: company.role,
      tradeType: company.tradeType,
    };

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(companyId, { $set: updateDto }, { new: true })
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.update',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: new Types.ObjectId(companyId),
      targetIdentifier: company.companyName,
      description: `Updated company ${company.companyName}`,
      previousValue,
      newValue: updateDto,
      metadata: {},
    });

    return updatedCompany;
  }

  /**
   * Delete company with cascade cleanup
   * Bug #6 Fix: Properly handles all related data to prevent orphaned records
   */
  async deleteCompany(
    companyId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const companyObjectId = new Types.ObjectId(companyId);

    // Check if company has active trades (trades in progress that can't be abandoned)
    const activeTrades = await this.tradeModel.countDocuments({
      $or: [{ buyer: companyObjectId }, { seller: companyObjectId }],
      tradePhase: { $in: ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL'] }, // Active phases
      negotiationStatus: 'accepted',
    });

    if (activeTrades > 0) {
      throw new BadRequestException(
        `Cannot delete company with ${activeTrades} active trades in progress. Please complete or cancel all trades first.`,
      );
    }

    // Get all users belonging to this company for cascade cleanup
    const companyUsers = await this.userModel
      .find({ company: companyId })
      .lean();
    const userIds = companyUsers.map((u) => u._id);
    const userIdStrings = companyUsers.map((u) => u._id.toString());

    // ═══════════════════════════════════════════════════════════════
    // CASCADE DELETE - Bug #6 Fix
    // ═══════════════════════════════════════════════════════════════

    // 1. Soft-delete trades where any company user is buyer or seller
    const buyerTradesUpdated = await this.tradeModel.updateMany(
      { buyer: { $in: userIds } },
      { $set: { buyerDeleted: true, buyerDeletedAt: new Date() } },
    );
    const sellerTradesUpdated = await this.tradeModel.updateMany(
      { seller: { $in: userIds } },
      { $set: { sellerDeleted: true, sellerDeletedAt: new Date() } },
    );

    // 2. Deactivate products owned by company users
    const productsDeactivated = await this.productModel.updateMany(
      { userId: { $in: userIdStrings } },
      {
        $set: {
          isActive: false,
          ownerDeleted: true,
          ownerDeletedAt: new Date(),
        },
      },
    );

    // 3. Delete wishlist items for company users
    const wishlistDeleted = await this.wishlistModel.deleteMany({
      user: { $in: userIds },
    });

    // 4. Delete notifications for company users
    const notificationsDeleted = await this.notificationModel.deleteMany({
      userId: { $in: userIds },
    });

    // 5. Mark messages from this company as sender deleted (soft delete)
    const messagesUpdated = await this.messageModel.updateMany(
      { sender: companyObjectId },
      { $set: { senderDeleted: true, senderDeletedAt: new Date() } },
    );

    // 6. Remove company from conversation participants
    const conversationsUpdated = await this.conversationModel.updateMany(
      { participants: companyObjectId },
      { $pull: { participants: companyObjectId } },
    );

    // 7. Delete all users belonging to this company
    const usersDeleted = await this.userModel.deleteMany({
      company: companyId,
    });

    // 8. Delete the company record
    await this.companyModel.findByIdAndDelete(companyId);

    // Log the action with cascade delete details
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.delete',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: companyObjectId,
      targetIdentifier: company.companyName,
      description: `Deleted company ${company.companyName} with cascade cleanup`,
      previousValue: { companyName: company.companyName, role: company.role },
      newValue: undefined,
      metadata: {
        cascadeResults: {
          usersDeleted: usersDeleted.deletedCount,
          tradesMarkedDeleted:
            buyerTradesUpdated.modifiedCount +
            sellerTradesUpdated.modifiedCount,
          productsDeactivated: productsDeactivated.modifiedCount,
          wishlistItemsDeleted: wishlistDeleted.deletedCount,
          notificationsDeleted: notificationsDeleted.deletedCount,
          messagesMarkedDeleted: messagesUpdated.modifiedCount,
          conversationsUpdated: conversationsUpdated.modifiedCount,
        },
      },
    });
  }

  /**
   * Verify company (set isKycVerified = true)
   */
  async verifyCompany(
    companyId: string,
    notes: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.isKycVerified) {
      throw new BadRequestException('Company is already verified');
    }

    const previousValue = {
      isKycVerified: false,
      kycVerifiedBy: null,
      kycVerifiedAt: null,
      kycVerificationNotes: null,
    };

    const newValue = {
      isKycVerified: true,
      kycVerifiedBy: new Types.ObjectId(adminId),
      kycVerifiedAt: new Date(),
      kycVerificationNotes: notes || '',
    };

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(companyId, { $set: newValue }, { new: true })
      .lean();

    // Get company users to notify
    const users = await this.userModel.find({ company: companyId }).lean();

    // Send notifications to all users
    for (const user of users) {
      await this.notificationService.createNotification({
        userId: user._id.toString(),
        type: 'company_kyc_verified',
        title: 'Company Verified',
        message:
          'Congratulations! Your company has been verified. You now have the verified company badge.',
        priority: 'high',
      });

      // Send email notification
      try {
        await this.mailService.sendTradeNotificationEmail(
          user.mail,
          'Company Verified - Breyus',
          `<h2>Company Verified!</h2>
          <p>Congratulations! Your company <strong>${company.companyName}</strong> has been verified on Breyus.</p>
          <p>You now have access to the verified company badge, which helps build trust with trading partners.</p>`,
        );
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.verify',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: new Types.ObjectId(companyId),
      targetIdentifier: company.companyName,
      description: `Verified company ${company.companyName}`,
      previousValue,
      newValue,
      metadata: { notes },
    });

    return updatedCompany;
  }

  /**
   * Unverify company (set isKycVerified = false)
   */
  async unverifyCompany(
    companyId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.isKycVerified) {
      throw new BadRequestException('Company is not verified');
    }

    const previousValue = {
      isKycVerified: true,
      kycVerifiedBy: company.kycVerifiedBy,
      kycVerifiedAt: company.kycVerifiedAt,
      kycVerificationNotes: company.kycVerificationNotes,
    };

    const newValue = {
      isKycVerified: false,
      kycVerifiedBy: null,
      kycVerifiedAt: null,
      kycVerificationNotes: null,
    };

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(companyId, { $set: newValue }, { new: true })
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.unverify',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: new Types.ObjectId(companyId),
      targetIdentifier: company.companyName,
      description: `Removed verification from company ${company.companyName}`,
      previousValue,
      newValue,
      metadata: {},
    });

    return updatedCompany;
  }

  /**
   * Manually approve GST verification (sets gstVerified = true, clears pending flag)
   * Used when Cashfree API failed during onboarding and admin verifies manually
   */
  async approveGst(
    companyId: string,
    notes: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if this is an Indian company with GST
    if (company.country !== 'India') {
      throw new BadRequestException(
        'GST verification is only applicable for Indian companies',
      );
    }

    if (company.gstVerified) {
      throw new BadRequestException('GST is already verified for this company');
    }

    const previousValue = {
      gstVerified: company.gstVerified || false,
      gstPendingManualReview: company.gstPendingManualReview || false,
      gstVerifiedAt: company.gstVerifiedAt || null,
    };

    const newValue = {
      gstVerified: true,
      gstPendingManualReview: false,
      gstVerifiedAt: new Date(),
    };

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(companyId, { $set: newValue }, { new: true })
      .lean();

    // Get company users to notify
    const users = await this.userModel.find({ company: companyId }).lean();

    // Send notifications to all users
    for (const user of users) {
      await this.notificationService.createNotification({
        userId: user._id.toString(),
        type: 'trade_completed', // Using existing type for positive notifications
        title: 'GST Verified',
        message: 'Your company GST has been manually verified by our team.',
        priority: 'high',
      });

      // Send email notification
      try {
        await this.mailService.sendTradeNotificationEmail(
          user.mail,
          'GST Verified - Breyus',
          `<h2>GST Verified!</h2>
          <p>Your company <strong>${company.companyName}</strong>'s GST (${company.taxId}) has been manually verified by our team.</p>
          <p>Your GST verification is now complete.</p>`,
        );
      } catch (error) {
        console.error('Failed to send GST verification email:', error);
      }
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.gst_approve',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: new Types.ObjectId(companyId),
      targetIdentifier: company.companyName,
      description: `Manually approved GST for company ${company.companyName} (${company.taxId})`,
      previousValue,
      newValue,
      metadata: { notes, taxId: company.taxId },
    });

    return updatedCompany;
  }

  /**
   * Clear GST pending manual review flag without verifying
   * Used when admin determines GST doesn't need verification (e.g., non-Indian company that was incorrectly flagged)
   */
  async clearGstPendingFlag(
    companyId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.gstPendingManualReview) {
      throw new BadRequestException(
        'Company does not have a pending GST review flag',
      );
    }

    const previousValue = {
      gstPendingManualReview: true,
    };

    const newValue = {
      gstPendingManualReview: false,
    };

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(companyId, { $set: newValue }, { new: true })
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'company.gst_clear_flag',
      actionCategory: 'companies',
      targetType: 'company',
      targetId: new Types.ObjectId(companyId),
      targetIdentifier: company.companyName,
      description: `Cleared GST pending review flag for company ${company.companyName}`,
      previousValue,
      newValue,
      metadata: { taxId: company.taxId },
    });

    return updatedCompany;
  }

  /**
   * Get count of companies with pending GST manual review
   */
  async getGstPendingCount(): Promise<number> {
    return this.companyModel.countDocuments({ gstPendingManualReview: true });
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [totalTrades, activeTrades, completedTrades, totalUsers] =
      await Promise.all([
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
        this.userModel.countDocuments({ company: companyId }),
      ]);

    return {
      totalTrades,
      activeTrades,
      completedTrades,
      totalUsers,
      totalProducts: 0, // TODO: Add when Product model reference is available
    };
  }

  /**
   * Get page-level statistics for the Companies page KPI cards
   */
  async getPageStats(): Promise<CompanyPageStats> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    // Current period stats
    const [total, verified, newThisMonth] = await Promise.all([
      this.companyModel.countDocuments(),
      this.companyModel.countDocuments({ isKycVerified: true }),
      this.companyModel.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      }),
    ]);

    // Count companies with pending KYC documents (has at least one pending document)
    const pending = await this.companyModel.countDocuments({
      isKycVerified: { $ne: true },
      'kycDocuments.status': KycDocumentStatus.PENDING,
    });

    // Previous period stats for comparison
    const [totalLastMonth, verifiedLastMonth, pendingLastMonth, newLastMonth] =
      await Promise.all([
        this.companyModel.countDocuments({
          createdAt: { $lt: startOfThisMonth },
        }),
        this.companyModel.countDocuments({
          isKycVerified: true,
          createdAt: { $lt: startOfThisMonth },
        }),
        this.companyModel.countDocuments({
          isKycVerified: { $ne: true },
          'kycDocuments.status': KycDocumentStatus.PENDING,
          createdAt: { $lt: startOfThisMonth },
        }),
        this.companyModel.countDocuments({
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        }),
      ]);

    // Calculate percentage changes
    const calculateChange = (
      current: number,
      previous: number,
    ): number | undefined => {
      if (previous === 0) return current > 0 ? 100 : undefined;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      total,
      totalChange: calculateChange(total, totalLastMonth),
      verified,
      verifiedChange: calculateChange(verified, verifiedLastMonth),
      pending,
      pendingChange: calculateChange(pending, pendingLastMonth),
      newThisMonth,
      newThisMonthChange: calculateChange(newThisMonth, newLastMonth),
    };
  }
}
