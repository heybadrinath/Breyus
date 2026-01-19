import { Injectable, NotFoundException, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertRule, AlertEventType } from './schemas/alert-rule.schema';
import { AlertHistory, AlertEmailStatus } from './schemas/alert-history.schema';
import { MailService } from '../../mail/mail.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto, GetAlertHistoryQueryDto } from './dto';

@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsService.name);
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(AlertRule.name) private alertRuleModel: Model<AlertRule>,
    @InjectModel(AlertHistory.name) private alertHistoryModel: Model<AlertHistory>,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    // Start periodic check every 5 minutes
    this.checkInterval = setInterval(
      () => this.checkThresholdAlerts(),
      5 * 60 * 1000,
    );
    this.logger.log('Alert scheduler started (5-minute interval)');
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.logger.log('Alert scheduler stopped');
    }
  }

  // ============================================================================
  // RULE CRUD
  // ============================================================================

  async createRule(dto: CreateAlertRuleDto, adminId: string): Promise<AlertRule> {
    const rule = new this.alertRuleModel({
      ...dto,
      createdBy: new Types.ObjectId(adminId),
    });
    return rule.save();
  }

  async getRules(eventType?: AlertEventType, isEnabled?: boolean): Promise<AlertRule[]> {
    const query: any = {};
    if (eventType) query.eventType = eventType;
    if (isEnabled !== undefined) query.isEnabled = isEnabled;

    return this.alertRuleModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getRuleById(ruleId: string): Promise<AlertRule> {
    const rule = await this.alertRuleModel.findById(ruleId).exec();
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }
    return rule;
  }

  async updateRule(ruleId: string, dto: UpdateAlertRuleDto): Promise<AlertRule> {
    const rule = await this.alertRuleModel.findById(ruleId).exec();
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }

    Object.assign(rule, dto);
    return rule.save();
  }

  async deleteRule(ruleId: string): Promise<void> {
    const result = await this.alertRuleModel.findByIdAndDelete(ruleId).exec();
    if (!result) {
      throw new NotFoundException('Alert rule not found');
    }
  }

  async toggleRule(ruleId: string): Promise<AlertRule> {
    const rule = await this.alertRuleModel.findById(ruleId).exec();
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }

    rule.isEnabled = !rule.isEnabled;
    return rule.save();
  }

  // ============================================================================
  // HISTORY
  // ============================================================================

  async getHistory(params: GetAlertHistoryQueryDto) {
    const {
      page = 1,
      limit = 20,
      ruleId,
      eventType,
      emailStatus,
      startDate,
      endDate,
    } = params;

    const query: any = {};

    if (ruleId) {
      query.ruleId = new Types.ObjectId(ruleId);
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (emailStatus) {
      query.emailStatus = emailStatus;
    }

    if (startDate || endDate) {
      query.triggeredAt = {};
      if (startDate) query.triggeredAt.$gte = new Date(startDate);
      if (endDate) query.triggeredAt.$lte = new Date(endDate);
    }

    const total = await this.alertHistoryModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);

    const data = await this.alertHistoryModel
      .find(query)
      .sort({ triggeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, totalPages };
  }

  // ============================================================================
  // TRIGGER ALERTS
  // ============================================================================

  /**
   * Trigger an immediate alert for an event
   */
  async triggerAlert(
    eventType: AlertEventType,
    payload: Record<string, any>,
  ): Promise<void> {
    const rules = await this.alertRuleModel.find({
      eventType,
      isEnabled: true,
    }).exec();

    for (const rule of rules) {
      await this.processRule(rule, payload);
    }
  }

  private async processRule(
    rule: AlertRule,
    payload: Record<string, any>,
  ): Promise<void> {
    // Check cooldown
    if (rule.lastTriggeredAt) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      const timeSinceLastTrigger = Date.now() - rule.lastTriggeredAt.getTime();
      if (timeSinceLastTrigger < cooldownMs) {
        this.logger.debug(
          `Alert "${rule.name}" in cooldown (${Math.round(
            (cooldownMs - timeSinceLastTrigger) / 60000,
          )} min remaining)`,
        );
        return;
      }
    }

    // Send alert emails
    const subject = this.getAlertSubject(rule.eventType, payload);
    const html = this.getAlertEmailHtml(rule.eventType, rule.name, payload);

    let status = AlertEmailStatus.SENT;
    let errorMessage: string | undefined;

    try {
      for (const recipient of rule.recipients) {
        await this.mailService.sendTradeNotificationEmail(recipient, subject, html);
      }
      this.logger.log(`Alert "${rule.name}" sent to ${rule.recipients.length} recipients`);
    } catch (error) {
      status = AlertEmailStatus.FAILED;
      errorMessage = error.message;
      this.logger.error(`Failed to send alert "${rule.name}": ${error.message}`);
    }

    // Log to history
    await this.alertHistoryModel.create({
      ruleId: rule._id,
      ruleName: rule.name,
      eventType: rule.eventType,
      triggeredAt: new Date(),
      payload,
      recipientsSent: rule.recipients,
      emailStatus: status,
      errorMessage,
    });

    // Update last triggered time
    rule.lastTriggeredAt = new Date();
    await rule.save();
  }

  private getAlertSubject(eventType: AlertEventType, payload: Record<string, any>): string {
    switch (eventType) {
      case AlertEventType.USER_SUSPENDED:
        return `Alert: User Suspended - ${payload.userEmail || 'Unknown'}`;
      case AlertEventType.KYC_PENDING_THRESHOLD:
        return `Alert: KYC Pending Threshold Exceeded (${payload.count || 0})`;
      case AlertEventType.TRADE_STALLED:
        return `Alert: Stalled Trades Detected (${payload.count || 0})`;
      case AlertEventType.FAILED_LOGIN_SPIKE:
        return `Alert: Failed Login Spike Detected`;
      case AlertEventType.NEW_DISPUTE:
        return `Alert: New Dispute Created`;
      default:
        return `Alert: ${eventType}`;
    }
  }

  private getAlertEmailHtml(
    eventType: AlertEventType,
    ruleName: string,
    payload: Record<string, any>,
  ): string {
    const timestamp = new Date().toISOString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #6b7280; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Breyus Admin Alert</h1>
          </div>
          <div class="content">
            <h2>${ruleName}</h2>
            <div class="detail">
              <span class="label">Event Type:</span> ${eventType}
            </div>
            <div class="detail">
              <span class="label">Timestamp:</span> ${timestamp}
            </div>
            <h3>Details:</h3>
            <pre style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(payload, null, 2)}
            </pre>
          </div>
          <div class="footer">
            <p>This is an automated alert from Breyus Admin Portal.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================================================
  // SCHEDULED CHECKS (for threshold-based alerts)
  // ============================================================================

  /**
   * Check threshold-based alerts (runs every 5 minutes)
   * This is a placeholder - actual checks would query respective services
   */
  private async checkThresholdAlerts(): Promise<void> {
    this.logger.debug('Running scheduled alert checks...');

    const enabledRules = await this.alertRuleModel.find({ isEnabled: true }).exec();

    for (const rule of enabledRules) {
      try {
        // Each event type has different check logic
        // For now, we skip actual checks - they would be triggered by other services
        // or implemented with actual database queries here
        switch (rule.eventType) {
          case AlertEventType.KYC_PENDING_THRESHOLD:
            // Would check: count of pending KYC docs > threshold
            break;
          case AlertEventType.TRADE_STALLED:
            // Would check: trades inactive for X days > threshold
            break;
          case AlertEventType.FAILED_LOGIN_SPIKE:
            // Would check: failed logins in time window > threshold
            break;
          default:
            // Event-triggered alerts (not scheduled)
            break;
        }
      } catch (error) {
        this.logger.error(`Error checking alert "${rule.name}": ${error.message}`);
      }
    }
  }

  /**
   * Send test alert to verify configuration
   */
  async sendTestAlert(ruleId: string): Promise<void> {
    const rule = await this.alertRuleModel.findById(ruleId).exec();
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }

    const testPayload = {
      test: true,
      message: 'This is a test alert',
      timestamp: new Date().toISOString(),
    };

    // Force trigger (bypass cooldown for test)
    const subject = `[TEST] ${this.getAlertSubject(rule.eventType, testPayload)}`;
    const html = this.getAlertEmailHtml(rule.eventType, `[TEST] ${rule.name}`, testPayload);

    for (const recipient of rule.recipients) {
      await this.mailService.sendTradeNotificationEmail(recipient, subject, html);
    }

    // Log to history
    await this.alertHistoryModel.create({
      ruleId: rule._id,
      ruleName: `[TEST] ${rule.name}`,
      eventType: rule.eventType,
      triggeredAt: new Date(),
      payload: testPayload,
      recipientsSent: rule.recipients,
      emailStatus: AlertEmailStatus.SENT,
    });

    this.logger.log(`Test alert sent for rule "${rule.name}"`);
  }
}
