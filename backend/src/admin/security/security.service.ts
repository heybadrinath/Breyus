import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlockedIP } from './schemas/blocked-ip.schema';
import {
  FailedLoginAttempt,
  FailedLoginReason,
} from './schemas/failed-login-attempt.schema';
import { ActivityLogService } from '../activity/activity-log.service';
import { BlockIPDto, GetFailedLoginsQueryDto } from './dto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectModel(BlockedIP.name) private blockedIPModel: Model<BlockedIP>,
    @InjectModel(FailedLoginAttempt.name)
    private failedLoginModel: Model<FailedLoginAttempt>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // ============================================================================
  // BLOCKED IPs
  // ============================================================================

  async getBlockedIPs(isActive?: boolean): Promise<BlockedIP[]> {
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Also filter out expired blocks
    const now = new Date();
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ];

    return this.blockedIPModel
      .find(query)
      .populate('blockedBy', 'firstName lastName email')
      .sort({ blockedAt: -1 })
      .exec();
  }

  async blockIP(
    dto: BlockIPDto,
    adminId: string,
    adminEmail: string,
  ): Promise<BlockedIP> {
    // Check if IP is already blocked
    const existing = await this.blockedIPModel
      .findOne({
        ipAddress: dto.ipAddress,
        isActive: true,
      })
      .exec();

    if (existing) {
      throw new ConflictException('IP address is already blocked');
    }

    const blockedIP = new this.blockedIPModel({
      ipAddress: dto.ipAddress,
      reason: dto.reason,
      blockedBy: new Types.ObjectId(adminId),
      blockedAt: new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isActive: true,
    });

    await blockedIP.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'security.block_ip',
      actionCategory: 'system',
      targetType: 'ip',
      targetIdentifier: dto.ipAddress,
      description: `Blocked IP address ${dto.ipAddress} - Reason: ${dto.reason}`,
      newValue: {
        ipAddress: dto.ipAddress,
        reason: dto.reason,
        expiresAt: dto.expiresAt,
      },
    });

    this.logger.log(`IP address ${dto.ipAddress} blocked by ${adminEmail}`);
    return blockedIP;
  }

  async unblockIP(
    blockedIPId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    const blockedIP = await this.blockedIPModel.findById(blockedIPId).exec();

    if (!blockedIP) {
      throw new NotFoundException('Blocked IP record not found');
    }

    blockedIP.isActive = false;
    await blockedIP.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'security.unblock_ip',
      actionCategory: 'system',
      targetType: 'ip',
      targetIdentifier: blockedIP.ipAddress,
      description: `Unblocked IP address ${blockedIP.ipAddress}`,
      previousValue: {
        ipAddress: blockedIP.ipAddress,
        reason: blockedIP.reason,
      },
    });

    this.logger.log(
      `IP address ${blockedIP.ipAddress} unblocked by ${adminEmail}`,
    );
  }

  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const now = new Date();
    const blockedIP = await this.blockedIPModel
      .findOne({
        ipAddress,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      })
      .exec();

    return !!blockedIP;
  }

  // ============================================================================
  // FAILED LOGIN ATTEMPTS
  // ============================================================================

  async logFailedLogin(
    email: string,
    ipAddress: string,
    reason: FailedLoginReason,
    userAgent?: string,
  ): Promise<void> {
    await this.failedLoginModel.create({
      email: email.toLowerCase().trim(),
      ipAddress,
      userAgent,
      attemptedAt: new Date(),
      reason,
    });

    this.logger.debug(
      `Failed login logged: ${email} from ${ipAddress} - ${reason}`,
    );
  }

  async getFailedLogins(params: GetFailedLoginsQueryDto) {
    const {
      page = 1,
      limit = 50,
      email,
      ipAddress,
      reason,
      startDate,
      endDate,
    } = params;

    const query: any = {};

    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (ipAddress) {
      query.ipAddress = ipAddress;
    }

    if (reason) {
      query.reason = reason;
    }

    if (startDate || endDate) {
      query.attemptedAt = {};
      if (startDate) query.attemptedAt.$gte = new Date(startDate);
      if (endDate) query.attemptedAt.$lte = new Date(endDate);
    }

    const total = await this.failedLoginModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);

    const data = await this.failedLoginModel
      .find(query)
      .sort({ attemptedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, totalPages };
  }

  async getFailedLoginStats(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || new Date();

    // Total count
    const total = await this.failedLoginModel
      .countDocuments({
        attemptedAt: { $gte: start, $lte: end },
      })
      .exec();

    // By reason
    const byReason = await this.failedLoginModel
      .aggregate([
        {
          $match: {
            attemptedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$reason',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            reason: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
      ])
      .exec();

    // Top IPs
    const topIPs = await this.failedLoginModel
      .aggregate([
        {
          $match: {
            attemptedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
            emails: { $addToSet: '$email' },
          },
        },
        {
          $project: {
            ipAddress: '$_id',
            count: 1,
            uniqueEmails: { $size: '$emails' },
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .exec();

    // Top emails
    const topEmails = await this.failedLoginModel
      .aggregate([
        {
          $match: {
            attemptedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$email',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            email: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .exec();

    // Hourly distribution (last 24 hours)
    const hourlyDistribution = await this.failedLoginModel
      .aggregate([
        {
          $match: {
            attemptedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d %H:00', date: '$attemptedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            hour: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { hour: 1 },
        },
      ])
      .exec();

    return {
      total,
      byReason,
      topIPs,
      topEmails,
      hourlyDistribution,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }
}
