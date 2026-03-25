import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schema/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  /**
   * Create and persist a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const newNotification = new this.notificationModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
      tradeId: dto.tradeId ? new Types.ObjectId(dto.tradeId) : undefined,
      conversationId: dto.conversationId
        ? new Types.ObjectId(dto.conversationId)
        : undefined,
    });
    return newNotification.save();
  }

  /**
   * Get paginated notifications for a user
   */
  async getNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, unreadOnly, type, category } = query;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (unreadOnly) {
      filter.read = false;
    }

    if (type) {
      filter.type = type;
    }

    if (category === 'trade') {
      filter.tradeId = { $exists: true };
    } else if (category === 'message') {
      filter.conversationId = { $exists: true };
    }

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Get N most recent unread notifications (for bell dropdown)
   */
  async getRecentUnread(
    userId: string,
    limit: number = 5,
  ): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId), read: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get total unread count for user (for badge)
   */
  async getUnreadCount(
    userId: string,
    type?: string,
    category?: string,
  ): Promise<number> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      read: false,
    };

    if (type) {
      filter.type = type;
    }

    if (category === 'trade') {
      filter.tradeId = { $exists: true };
    } else if (category === 'message') {
      filter.conversationId = { $exists: true };
    }

    return this.notificationModel.countDocuments(filter);
  }

  /**
   * Get breakdown of unread counts for badge display
   * Returns counts for: pr, po, spa, ongoing, messages, total
   */
  async getUnreadCountBreakdown(userId: string): Promise<{
    pr: number;
    po: number;
    spa: number;
    ongoing: number;
    messages: number;
    total: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    // Define notification types that map to each trade phase/category
    const prTypes = ['trade_created', 'counter_offer'];
    const poTypes = ['trade_accepted', 'trade_rejected'];
    const spaTypes = [
      'document_uploaded',
      'documents_invalidated',
      'document_rejected',
      'signed_spa_required',
    ];
    const ongoingTypes = [
      'phase_advanced',
      'last_attempt_warning',
      'last_counter_warning',
      'final_offer_notification',
    ];
    const messageTypes = ['new_message'];

    // Run all count queries in parallel for efficiency
    const [pr, po, spa, ongoing, messages, total] = await Promise.all([
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
        type: { $in: prTypes },
      }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
        type: { $in: poTypes },
      }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
        type: { $in: spaTypes },
      }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
        type: { $in: ongoingTypes },
      }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
        type: { $in: messageTypes },
      }),
      this.notificationModel.countDocuments({
        userId: userObjectId,
        read: false,
      }),
    ]);

    return { pr, po, spa, ongoing, messages, total };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
  }

  async markConversationNotificationsRead(
    userIds: string[],
    conversationId: string,
  ): Promise<void> {
    if (!userIds.length) return;
    await this.notificationModel.updateMany(
      {
        userId: { $in: userIds.map((id) => new Types.ObjectId(id)) },
        conversationId: new Types.ObjectId(conversationId),
        read: false,
      },
      { $set: { read: true } },
    );
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    await this.notificationModel.deleteOne({ _id: notification._id });
  }

  /**
   * Delete all read notifications for user
   */
  async deleteReadNotifications(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
      read: true,
    });
  }

  /**
   * Cleanup old read notifications (called by scheduled job)
   * @param daysOld - Delete read notifications older than this many days
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationModel.deleteMany({
      read: true,
      createdAt: { $lt: cutoffDate },
    });

    this.logger.log(`Cleaned up ${result.deletedCount} old read notifications`);
    return result.deletedCount;
  }
}
