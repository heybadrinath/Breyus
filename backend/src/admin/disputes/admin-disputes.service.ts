import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TradeDispute, DisputeMessage } from './schemas/trade-dispute.schema';
import { Trade } from '../../trade/schema/trade.schema';
import { User } from '../../users/user.schema';
import { AdminUser } from '../auth/schemas/admin-user.schema';
import { GetDisputesQueryDto } from './dto/get-disputes-query.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AddDisputeMessageDto } from './dto/add-dispute-message.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ActivityLogService } from '../activity/activity-log.service';
import { NotificationService } from '../../notification/notification.service';
import { MailService } from '../../mail/mail.service';
import { emailTemplates } from '../../mail/templates/email.templates';

export interface PaginatedDisputesResult {
  disputes: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DisputeStats {
  total: number;
  open: number;
  underReview: number;
  resolved: number;
  closed: number;
  byPriority: Record<string, number>;
  byReason: Record<string, number>;
  avgResolutionTimeHours: number;
  unassigned: number;
}

@Injectable()
export class AdminDisputesService {
  private readonly logger = new Logger(AdminDisputesService.name);

  constructor(
    @InjectModel(TradeDispute.name) private disputeModel: Model<TradeDispute>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUser>,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Get paginated list of disputes with filters
   */
  async getDisputes(
    query: GetDisputesQueryDto,
  ): Promise<PaginatedDisputesResult> {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      reason,
      assignedTo,
      unassigned,
      tradeId,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Filter by reason
    if (reason) {
      filter.reason = reason;
    }

    // Filter by assigned admin
    if (assignedTo && Types.ObjectId.isValid(assignedTo)) {
      filter.assignedAdmin = new Types.ObjectId(assignedTo);
    }

    // Filter unassigned
    if (unassigned === true) {
      filter.assignedAdmin = null;
    }

    // Filter by trade
    if (tradeId && Types.ObjectId.isValid(tradeId)) {
      filter.trade = new Types.ObjectId(tradeId);
    }

    // Search by email or dispute ID
    if (search) {
      if (Types.ObjectId.isValid(search)) {
        filter._id = new Types.ObjectId(search);
      } else {
        filter.raisedByEmail = { $regex: search, $options: 'i' };
      }
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    // Custom sort for priority (urgent > high > medium > low)
    let sort: any;
    if (sortBy === 'priority') {
      // We'll sort after fetching
      sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const [disputes, total] = await Promise.all([
      this.disputeModel
        .find(filter)
        .populate({
          path: 'trade',
          select: 'tradePhase negotiationStatus product buyer seller',
          populate: [
            { path: 'product', select: 'name' },
            { path: 'buyer', select: 'mail' },
            { path: 'seller', select: 'mail' },
          ],
        })
        .populate('raisedBy', 'mail')
        .populate('assignedAdmin', 'email name')
        .populate('resolvedBy', 'email name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.disputeModel.countDocuments(filter).exec(),
    ]);

    // Sort by priority if needed
    let sortedDisputes = disputes;
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      sortedDisputes = [...disputes].sort((a, b) => {
        const orderA =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
        const orderB =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      });
    }

    return {
      disputes: sortedDisputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(): Promise<DisputeStats> {
    const [
      total,
      open,
      underReview,
      resolved,
      closed,
      unassigned,
      priorityAggregation,
      reasonAggregation,
      avgResolutionAggregation,
    ] = await Promise.all([
      this.disputeModel.countDocuments(),
      this.disputeModel.countDocuments({ status: 'open' }),
      this.disputeModel.countDocuments({ status: 'under_review' }),
      this.disputeModel.countDocuments({ status: 'resolved' }),
      this.disputeModel.countDocuments({ status: 'closed' }),
      this.disputeModel.countDocuments({
        assignedAdmin: null,
        status: { $in: ['open', 'under_review'] },
      }),
      this.disputeModel.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      this.disputeModel.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
      this.disputeModel.aggregate([
        { $match: { resolvedAt: { $ne: null } } },
        {
          $project: {
            resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } },
      ]),
    ]);

    const byPriority: Record<string, number> = {};
    priorityAggregation.forEach((item: any) => {
      byPriority[item._id || 'unknown'] = item.count;
    });

    const byReason: Record<string, number> = {};
    reasonAggregation.forEach((item: any) => {
      byReason[item._id || 'unknown'] = item.count;
    });

    const avgResolutionTimeMs = avgResolutionAggregation[0]?.avgTime || 0;
    const avgResolutionTimeHours = Math.round(
      avgResolutionTimeMs / (1000 * 60 * 60),
    );

    return {
      total,
      open,
      underReview,
      resolved,
      closed,
      unassigned,
      byPriority,
      byReason,
      avgResolutionTimeHours,
    };
  }

  /**
   * Get dispute by ID with full details
   */
  async getDisputeById(disputeId: string): Promise<any> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel
      .findById(disputeId)
      .populate({
        path: 'trade',
        populate: [
          { path: 'product' },
          {
            path: 'buyer',
            select: 'mail company',
            populate: { path: 'company', select: 'companyName' },
          },
          {
            path: 'seller',
            select: 'mail company',
            populate: { path: 'company', select: 'companyName' },
          },
        ],
      })
      .populate('raisedBy', 'mail')
      .populate('assignedAdmin', 'email name')
      .populate('resolvedBy', 'email name')
      .populate('closedBy', 'email name')
      .lean()
      .exec();

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  /**
   * Assign admin to dispute
   */
  async assignDispute(
    disputeId: string,
    adminIdToAssign: string,
    currentAdminId: string,
    currentAdminEmail: string,
    notes?: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }
    if (!Types.ObjectId.isValid(adminIdToAssign)) {
      throw new BadRequestException('Invalid admin ID');
    }

    const dispute = await this.disputeModel.findById(disputeId).lean();
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const adminToAssign = await this.adminUserModel
      .findById(adminIdToAssign)
      .select('email name')
      .lean();
    if (!adminToAssign) {
      throw new NotFoundException('Admin user not found');
    }

    const previousValue = {
      assignedAdmin: dispute.assignedAdmin,
      assignedAdminEmail: dispute.assignedAdminEmail,
    };

    const update: any = {
      assignedAdmin: new Types.ObjectId(adminIdToAssign),
      assignedAdminEmail: adminToAssign.email,
      assignedAt: new Date(),
    };

    // If this is the first assignment, also set status to under_review
    if (dispute.status === 'open') {
      update.status = 'under_review';
    }

    // Add a system message if notes provided
    if (notes) {
      const message: DisputeMessage = {
        _id: new Types.ObjectId(),
        content: `Admin assigned: ${notes}`,
        sender: new Types.ObjectId(currentAdminId),
        senderType: 'admin',
        senderEmail: currentAdminEmail,
        createdAt: new Date(),
        isInternal: true,
      };
      update.$push = { messages: message };
    }

    const updatedDispute = await this.disputeModel
      .findByIdAndUpdate(disputeId, update, { new: true })
      .populate('assignedAdmin', 'email name')
      .populate({
        path: 'trade',
        select: 'product',
        populate: { path: 'product', select: 'name' },
      })
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(currentAdminId),
      adminEmail: currentAdminEmail,
      action: 'dispute.assign',
      actionCategory: 'disputes',
      targetType: 'dispute',
      targetId: new Types.ObjectId(disputeId),
      targetIdentifier: disputeId,
      description: `Assigned dispute ${disputeId} to ${adminToAssign.email}`,
      previousValue,
      newValue: {
        assignedAdmin: adminIdToAssign,
        assignedAdminEmail: adminToAssign.email,
      },
      metadata: { notes },
    });

    // Send email notification to assigned admin
    try {
      const productName =
        (updatedDispute?.trade as any)?.product?.name || 'Unknown Product';
      const emailHtml = emailTemplates.disputeAssigned(
        disputeId,
        productName,
        currentAdminEmail,
      );
      await this.mailService.sendTradeNotificationEmail(
        adminToAssign.email,
        `Dispute Assigned: ${productName}`,
        emailHtml,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send dispute assigned email to ${adminToAssign.email}:`,
        error,
      );
    }

    return updatedDispute;
  }

  /**
   * Update dispute status
   */
  async updateDisputeStatus(
    disputeId: string,
    statusDto: UpdateDisputeStatusDto,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel.findById(disputeId).lean();
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const previousStatus = dispute.status;
    const update: any = { status: statusDto.status };

    // Add timestamps based on status
    if (statusDto.status === 'closed' && previousStatus !== 'closed') {
      update.closedAt = new Date();
      update.closedBy = new Types.ObjectId(adminId);
    }

    // Add a system message if notes provided
    if (statusDto.notes) {
      const message: DisputeMessage = {
        _id: new Types.ObjectId(),
        content: `Status changed to ${statusDto.status}: ${statusDto.notes}`,
        sender: new Types.ObjectId(adminId),
        senderType: 'admin',
        senderEmail: adminEmail,
        createdAt: new Date(),
        isInternal: true,
      };
      update.$push = { messages: message };
    }

    const updatedDispute = await this.disputeModel
      .findByIdAndUpdate(disputeId, update, { new: true })
      .populate('raisedBy', 'mail _id')
      .populate({
        path: 'trade',
        select: 'product',
        populate: { path: 'product', select: 'name' },
      })
      .lean();

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'dispute.update_status',
      actionCategory: 'disputes',
      targetType: 'dispute',
      targetId: new Types.ObjectId(disputeId),
      targetIdentifier: disputeId,
      description: `Updated dispute status from ${previousStatus} to ${statusDto.status}`,
      previousValue: { status: previousStatus },
      newValue: { status: statusDto.status },
      metadata: { notes: statusDto.notes },
    });

    // Notify the user who raised the dispute
    const raisedByUser = updatedDispute?.raisedBy as any;
    if (raisedByUser?._id && raisedByUser?.mail) {
      // Create in-app notification
      await this.notificationService.createNotification({
        userId: raisedByUser._id.toString(),
        type: 'dispute_status_updated',
        title: 'Dispute Status Updated',
        message: `Your dispute status has changed from ${previousStatus} to ${statusDto.status}.`,
        priority: 'normal',
      });

      // Send email notification
      try {
        const productName =
          (updatedDispute?.trade as any)?.product?.name || 'Unknown Product';
        const emailHtml = emailTemplates.disputeStatusUpdated(
          disputeId,
          productName,
          previousStatus,
          statusDto.status,
        );
        await this.mailService.sendTradeNotificationEmail(
          raisedByUser.mail,
          `Dispute Status Updated: ${productName}`,
          emailHtml,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send dispute status email to ${raisedByUser.mail}:`,
          error,
        );
      }
    }

    return updatedDispute;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolveDto: ResolveDisputeDto,
    adminId: string,
    adminEmail: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel.findById(disputeId).lean();
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new BadRequestException('Dispute is already resolved or closed');
    }

    const update = {
      status: 'resolved',
      resolutionNotes: resolveDto.resolutionNotes,
      resolvedAt: new Date(),
      resolvedBy: new Types.ObjectId(adminId),
      resolvedByEmail: adminEmail,
      $push: {
        messages: {
          _id: new Types.ObjectId(),
          content: `Dispute resolved: ${resolveDto.resolutionNotes}`,
          sender: new Types.ObjectId(adminId),
          senderType: 'admin',
          senderEmail: adminEmail,
          createdAt: new Date(),
          isInternal: false, // Resolution is visible to users
        },
      },
    };

    const updatedDispute = await this.disputeModel
      .findByIdAndUpdate(disputeId, update, { new: true })
      .populate('raisedBy', 'mail')
      .lean();

    // Clear activeDispute from trade
    await this.tradeModel.findByIdAndUpdate(dispute.trade, {
      $unset: { activeDispute: '' },
    });

    // Get product name for email
    const tradeWithProduct = await this.tradeModel
      .findById(dispute.trade)
      .populate('product', 'name')
      .lean();
    const productName = (tradeWithProduct as any)?.product?.name || 'Unknown Product';

    // Notify the user who raised the dispute
    const raisedByUser = updatedDispute?.raisedBy as any;
    if (raisedByUser?._id) {
      // Create in-app notification
      await this.notificationService.createNotification({
        userId: raisedByUser._id.toString(),
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved. Check the resolution notes for details.`,
        priority: 'high',
      });

      // Send email notification
      if (raisedByUser.mail) {
        try {
          const emailHtml = emailTemplates.disputeResolved(
            disputeId,
            resolveDto.resolutionNotes,
            productName,
          );
          await this.mailService.sendTradeNotificationEmail(
            raisedByUser.mail,
            `Dispute Resolved: ${productName}`,
            emailHtml,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send dispute resolved email to ${raisedByUser.mail}:`,
            error,
          );
        }
      }
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'dispute.resolve',
      actionCategory: 'disputes',
      targetType: 'dispute',
      targetId: new Types.ObjectId(disputeId),
      targetIdentifier: disputeId,
      description: `Resolved dispute ${disputeId}`,
      previousValue: { status: dispute.status },
      newValue: {
        status: 'resolved',
        resolutionNotes: resolveDto.resolutionNotes,
      },
      metadata: {},
    });

    return updatedDispute;
  }

  /**
   * Add message to dispute
   */
  async addMessage(
    disputeId: string,
    messageDto: AddDisputeMessageDto,
    senderId: string,
    senderEmail: string,
    senderType: 'buyer' | 'seller' | 'admin',
  ): Promise<DisputeMessage> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel.findById(disputeId).lean();
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === 'closed') {
      throw new BadRequestException('Cannot add messages to a closed dispute');
    }

    const newMessage: DisputeMessage = {
      _id: new Types.ObjectId(),
      content: messageDto.content,
      sender: new Types.ObjectId(senderId),
      senderType,
      senderEmail,
      createdAt: new Date(),
      isInternal: senderType === 'admin' ? messageDto.isInternal : false,
    };

    await this.disputeModel.findByIdAndUpdate(disputeId, {
      $push: { messages: newMessage },
    });

    // Log admin messages
    if (senderType === 'admin') {
      await this.activityLogService.log({
        adminId: new Types.ObjectId(senderId),
        adminEmail: senderEmail,
        action: 'dispute.add_message',
        actionCategory: 'disputes',
        targetType: 'dispute',
        targetId: new Types.ObjectId(disputeId),
        targetIdentifier: disputeId,
        description: `Added ${messageDto.isInternal ? 'internal ' : ''}message to dispute`,
        previousValue: undefined,
        newValue: {
          messageId: newMessage._id,
          isInternal: messageDto.isInternal,
        },
        metadata: {},
      });
    }

    // Send notification to other parties (if message is not internal)
    if (!newMessage.isInternal) {
      const fullDispute = await this.disputeModel
        .findById(disputeId)
        .populate('raisedBy', 'mail _id')
        .populate({
          path: 'trade',
          select: 'buyer seller product',
          populate: [
            { path: 'buyer', select: 'mail _id' },
            { path: 'seller', select: 'mail _id' },
            { path: 'product', select: 'name' },
          ],
        })
        .lean();

      if (fullDispute) {
        const trade = fullDispute.trade as any;
        const raisedBy = fullDispute.raisedBy as any;
        const productName = trade?.product?.name || 'Unknown Product';

        // Determine who should receive the notification
        const recipientsToNotify: { userId: string; email: string }[] = [];

        // If sender is admin, notify the user who raised the dispute
        if (senderType === 'admin' && raisedBy?._id) {
          recipientsToNotify.push({
            userId: raisedBy._id.toString(),
            email: raisedBy.mail,
          });
        }
        // If sender is buyer/seller, notify the other party and admin if assigned
        else {
          if (
            senderType === 'buyer' &&
            trade?.seller?._id &&
            trade.seller._id.toString() !== senderId
          ) {
            recipientsToNotify.push({
              userId: trade.seller._id.toString(),
              email: trade.seller.mail,
            });
          } else if (
            senderType === 'seller' &&
            trade?.buyer?._id &&
            trade.buyer._id.toString() !== senderId
          ) {
            recipientsToNotify.push({
              userId: trade.buyer._id.toString(),
              email: trade.buyer.mail,
            });
          }
        }

        // Send notifications
        for (const recipient of recipientsToNotify) {
          try {
            // In-app notification
            await this.notificationService.createNotification({
              userId: recipient.userId,
              type: 'dispute_message',
              title: 'New Dispute Message',
              message: `New message from ${senderEmail} in your dispute.`,
              priority: 'normal',
            });

            // Email notification (with preview)
            const messagePreview =
              messageDto.content.length > 100
                ? messageDto.content.substring(0, 100) + '...'
                : messageDto.content;
            const emailHtml = emailTemplates.disputeMessage(
              disputeId,
              senderEmail,
              messagePreview,
              { productName },
            );
            await this.mailService.sendTradeNotificationEmail(
              recipient.email,
              `New Dispute Message: ${productName}`,
              emailHtml,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send dispute message notification to ${recipient.email}:`,
              error,
            );
          }
        }
      }
    }

    return newMessage;
  }

  /**
   * Get messages for a dispute
   */
  async getMessages(
    disputeId: string,
    includeInternal: boolean = true,
  ): Promise<DisputeMessage[]> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel
      .findById(disputeId)
      .select('messages')
      .lean()
      .exec();

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    let messages = dispute.messages || [];

    // Filter out internal messages if not admin
    if (!includeInternal) {
      messages = messages.filter((m) => !m.isInternal);
    }

    // Sort by createdAt ascending
    return messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  /**
   * Create dispute (user-facing)
   */
  async createDispute(
    tradeId: string,
    createDto: CreateDisputeDto,
    userId: string,
    userEmail: string,
    userRole: 'buyer' | 'seller',
  ): Promise<any> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Check if there's already an active dispute
    if ((trade as any).activeDispute) {
      throw new ConflictException('This trade already has an active dispute');
    }

    // ========================
    // PHASE 2 REFACTORING: Dispute Eligibility Validation
    // ========================
    const tradeData = trade as any;

    // Only allow disputes from PAYMENT phase onwards
    const allowedPhasesForDispute = [
      'PAYMENT',
      'BOL',
      'COMPLETED',
      'CANCELLED',
    ];
    if (!allowedPhasesForDispute.includes(tradeData.tradePhase)) {
      throw new BadRequestException(
        `Disputes can only be raised from Payment phase onwards. Current phase: ${tradeData.tradePhase}`,
      );
    }

    // For cancelled/completed trades, check 30-day dispute window
    if (
      tradeData.tradePhase === 'CANCELLED' ||
      tradeData.tradePhase === 'COMPLETED'
    ) {
      if (tradeData.disputeEligibilityEndsAt) {
        const eligibilityEnds = new Date(tradeData.disputeEligibilityEndsAt);
        if (new Date() > eligibilityEnds) {
          throw new BadRequestException(
            'Dispute window has expired. Disputes must be raised within 30 days of trade completion or cancellation.',
          );
        }
      } else {
        // Legacy trades without disputeEligibilityEndsAt: Check completedAt/cancelledAt + 30 days
        const endDate = tradeData.completedAt || tradeData.cancelledAt;
        if (endDate) {
          const thirtyDaysAfter = new Date(
            new Date(endDate).getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          if (new Date() > thirtyDaysAfter) {
            throw new BadRequestException(
              'Dispute window has expired. Disputes must be raised within 30 days of trade completion or cancellation.',
            );
          }
        }
      }
    }
    // ========================
    // END PHASE 2 REFACTORING
    // ========================

    // Create the dispute
    const dispute = new this.disputeModel({
      trade: new Types.ObjectId(tradeId),
      raisedBy: new Types.ObjectId(userId),
      raisedByRole: userRole,
      raisedByEmail: userEmail,
      reason: createDto.reason,
      description: createDto.description,
      priority: createDto.priority || 'medium',
      status: 'open',
      messages: [
        {
          _id: new Types.ObjectId(),
          content: createDto.description,
          sender: new Types.ObjectId(userId),
          senderType: userRole,
          senderEmail: userEmail,
          createdAt: new Date(),
          isInternal: false,
        },
      ],
    });

    await dispute.save();

    // Update trade with activeDispute reference
    await this.tradeModel.findByIdAndUpdate(tradeId, {
      activeDispute: dispute._id,
    });

    // Get product name for notifications
    const tradeWithProduct = await this.tradeModel
      .findById(tradeId)
      .populate('product', 'name')
      .lean();
    const productName = (tradeWithProduct as any)?.product?.name || 'Unknown Product';

    // Notify admins about new dispute (send to all active admins)
    try {
      const admins = await this.adminUserModel
        .find({ isActive: true })
        .select('email')
        .lean();

      for (const admin of admins) {
        try {
          const emailHtml = emailTemplates.disputeCreated(
            (dispute._id as any).toString(),
            productName,
            createDto.reason,
            userEmail,
          );
          await this.mailService.sendTradeNotificationEmail(
            admin.email,
            `New Dispute: ${productName} - ${createDto.reason}`,
            emailHtml,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send dispute created email to admin ${admin.email}:`,
            emailError,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to notify admins about new dispute:', error);
    }

    return dispute;
  }

  /**
   * Get dispute for a trade (user-facing)
   */
  async getDisputeByTrade(tradeId: string): Promise<any> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const dispute = await this.disputeModel
      .findOne({ trade: new Types.ObjectId(tradeId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return dispute;
  }
}
