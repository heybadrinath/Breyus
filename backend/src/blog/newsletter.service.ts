import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  NewsletterSubscriber,
  SubscriptionSource,
} from './schemas/newsletter-subscriber.schema';
import { BlogPost } from './schemas/blog-post.schema';
import { AdminSubscriberQueryDto } from './dto/newsletter.dto';
import { MailService } from '../mail/mail.service';
import { emailTemplates } from '../mail/templates/email.templates';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private readonly subscriberModel: Model<NewsletterSubscriber>,
    @InjectModel(BlogPost.name)
    private readonly blogPostModel: Model<BlogPost>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Subscribe an email to the newsletter
   * Reactivates if previously unsubscribed
   */
  async subscribe(
    email: string,
    source: SubscriptionSource = SubscriptionSource.BLOG_HOMEPAGE,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if subscriber already exists
    const existing = await this.subscriberModel.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          'This email is already subscribed to our newsletter',
        );
      }

      // Reactivate inactive subscriber
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.source = source;
      existing.unsubscribeToken = crypto.randomBytes(32).toString('hex');
      await existing.save();

      this.logger.log(`Reactivated subscriber: ${normalizedEmail}`);
      return {
        message: 'Welcome back! Your subscription has been reactivated.',
      };
    }

    // Create new subscriber
    await this.subscriberModel.create({
      email: normalizedEmail,
      source,
      subscribedAt: new Date(),
    });

    this.logger.log(`New subscriber: ${normalizedEmail} (source: ${source})`);
    return { message: 'Successfully subscribed to the Breyus newsletter!' };
  }

  /**
   * Unsubscribe using unique token (no auth required)
   */
  async unsubscribe(token: string) {
    const subscriber = await this.subscriberModel.findOne({
      unsubscribeToken: token,
    });

    if (!subscriber) {
      throw new NotFoundException('Invalid unsubscribe link');
    }

    if (!subscriber.isActive) {
      return { message: 'You are already unsubscribed.' };
    }

    subscriber.isActive = false;
    await subscriber.save();

    this.logger.log(`Unsubscribed: ${subscriber.email}`);
    return {
      message:
        'You have been successfully unsubscribed from the Breyus newsletter.',
    };
  }

  /**
   * Send weekly digest email to all active subscribers
   * Queries posts published in the last 7 days
   */
  async sendWeeklyDigest() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recently published posts
    const recentPosts = await this.blogPostModel
      .find({
        status: 'published',
        isDeleted: false,
        publishedAt: { $gte: sevenDaysAgo },
      })
      .select(
        'title slug excerpt featuredImage publishedAt writerDisplayName categories',
      )
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean();

    if (recentPosts.length === 0) {
      this.logger.log('No new posts this week — skipping digest');
      return { sent: 0, posts: 0 };
    }

    // Get all active subscribers
    const subscribers = await this.subscriberModel
      .find({ isActive: true })
      .select('email unsubscribeToken')
      .lean();

    if (subscribers.length === 0) {
      this.logger.log('No active subscribers — skipping digest');
      return { sent: 0, posts: recentPosts.length };
    }

    const blogUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let sentCount = 0;
    let failCount = 0;

    // Send in batches of 50 to avoid SMTP overload
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (subscriber) => {
        try {
          const unsubscribeUrl = `${blogUrl}/blog/unsubscribe/${subscriber.unsubscribeToken}`;
          const html = emailTemplates.weeklyDigest(
            recentPosts,
            unsubscribeUrl,
            blogUrl,
          );

          await this.mailService.sendTradeNotificationEmail(
            subscriber.email,
            'Your Weekly Breyus Blog Digest',
            html,
          );

          // Update lastDigestSentAt
          await this.subscriberModel.updateOne(
            { _id: (subscriber as any)._id },
            { lastDigestSentAt: new Date() },
          );

          sentCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to send digest to ${subscriber.email}: ${error.message}`,
          );
        }
      });

      await Promise.all(sendPromises);

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.logger.log(
      `Weekly digest sent: ${sentCount} success, ${failCount} failed, ${recentPosts.length} posts`,
    );

    return {
      sent: sentCount,
      failed: failCount,
      posts: recentPosts.length,
      totalSubscribers: subscribers.length,
    };
  }

  /**
   * Get subscriber statistics for admin dashboard
   */
  async getStats() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      inactive,
      subscribedThisWeek,
      subscribedLastWeek,
      sourceBreakdown,
    ] = await Promise.all([
      this.subscriberModel.countDocuments(),
      this.subscriberModel.countDocuments({ isActive: true }),
      this.subscriberModel.countDocuments({ isActive: false }),
      this.subscriberModel.countDocuments({
        subscribedAt: { $gte: oneWeekAgo },
        isActive: true,
      }),
      this.subscriberModel.countDocuments({
        subscribedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
        isActive: true,
      }),
      this.subscriberModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Calculate growth rate
    const growthRate =
      subscribedLastWeek > 0
        ? Math.round(
            ((subscribedThisWeek - subscribedLastWeek) / subscribedLastWeek) *
              100,
          )
        : subscribedThisWeek > 0
          ? 100
          : 0;

    return {
      totalSubscribers: total,
      activeSubscribers: active,
      inactiveSubscribers: inactive,
      newThisWeek: subscribedThisWeek,
      growthRate,
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s._id,
        count: s.count,
      })),
    };
  }

  /**
   * Get paginated subscriber list for admin
   */
  async getSubscribers(queryDto: AdminSubscriberQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      source,
      sortBy = 'subscribedAt',
      sortOrder = 'desc',
    } = queryDto;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (source) {
      filter.source = source;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [subscribers, total] = await Promise.all([
      this.subscriberModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-unsubscribeToken')
        .lean(),
      this.subscriberModel.countDocuments(filter),
    ]);

    return {
      subscribers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Export subscribers as CSV string
   */
  async exportCsv(): Promise<string> {
    const subscribers = await this.subscriberModel
      .find({ isActive: true })
      .select('email subscribedAt source')
      .sort({ subscribedAt: -1 })
      .lean();

    const header = 'Email,Subscribed Date,Source\n';
    const rows = subscribers
      .map(
        (s) =>
          `${s.email},${new Date(s.subscribedAt).toISOString()},${s.source}`,
      )
      .join('\n');

    return header + rows;
  }

  /**
   * Get subscription status for a given email
   * Used by authenticated users to check their own subscription on settings page
   */
  async getStatusByEmail(email: string): Promise<{ isSubscribed: boolean }> {
    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await this.subscriberModel.findOne({
      email: normalizedEmail,
      isActive: true,
    });
    return { isSubscribed: !!subscriber };
  }

  /**
   * Toggle subscription for a given email
   * Used by authenticated users from the settings page
   */
  async toggleByEmail(email: string, enabled: boolean) {
    const normalizedEmail = email.toLowerCase().trim();

    if (enabled) {
      // Subscribe or reactivate — track that it came from the settings page
      return this.subscribe(normalizedEmail, SubscriptionSource.BLOG_SETTINGS);
    }

    // Unsubscribe by email
    const subscriber = await this.subscriberModel.findOne({
      email: normalizedEmail,
    });

    if (!subscriber) {
      return { message: 'You are not subscribed.' };
    }

    if (!subscriber.isActive) {
      return { message: 'You are already unsubscribed.' };
    }

    subscriber.isActive = false;
    await subscriber.save();

    this.logger.log(`User toggled off newsletter: ${normalizedEmail}`);
    return { message: 'You have been unsubscribed from the newsletter.' };
  }

  /**
   * Remove (deactivate) a subscriber by ID — admin action
   */
  async removeSubscriber(id: string) {
    const subscriber = await this.subscriberModel.findById(id);
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    subscriber.isActive = false;
    await subscriber.save();

    this.logger.log(`Admin removed subscriber: ${subscriber.email}`);
    return { message: `Unsubscribed ${subscriber.email}` };
  }
}
