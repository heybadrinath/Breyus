import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsletterService } from './newsletter.service';

/**
 * NewsletterCronService handles scheduled newsletter tasks
 *
 * Cron Schedule:
 * - Weekly digest: Every Monday at 9:00 AM server time
 */
@Injectable()
export class NewsletterCronService {
  private readonly logger = new Logger(NewsletterCronService.name);

  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * Send weekly digest every Monday at 9 AM
   * Cron: second minute hour dayOfMonth month dayOfWeek
   *        0      0      9    *          *     1
   */
  @Cron('0 0 9 * * 1', { name: 'weekly-newsletter-digest' })
  async handleWeeklyDigest() {
    this.logger.log('Starting weekly newsletter digest...');

    try {
      const result = await this.newsletterService.sendWeeklyDigest();
      this.logger.log(
        `Weekly digest complete: ${result.sent} emails sent for ${result.posts} posts`,
      );
    } catch (error) {
      this.logger.error(`Weekly digest failed: ${error.message}`, error.stack);
    }
  }
}
