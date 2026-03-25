import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { TradeGateway } from './trade.gateway';
import { Trade } from './schema/trade.schema';
import { emailTemplates } from '../mail/templates/email.templates';
import { NotificationService } from '../notification/notification.service';

interface PopulatedTrade extends Omit<Trade, 'product' | 'buyer' | 'seller'> {
  _id: any; // MongoDB ObjectId or string
  product: {
    _id: string;
    name: string;
    price?: string | number;
    currency?: string;
  };
  quantity: number;
  quantityUnit: string;
  buyerOfferedPrice?: number;
  sellerOfferedPrice?: number;
  buyerIncoterms?: Trade['buyerIncoterms'];
  sellerOfferedIncoterms?: Trade['sellerOfferedIncoterms'];
  buyer: {
    _id: string;
    mail: string;
    company?: {
      companyName?: string;
      founderName?: string;
    } | null;
    notificationPreferences?: {
      email: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
        documentRejected?: boolean;
        lastAttemptWarning?: boolean;
        tradeAutoCancelled?: boolean;
        signedSpaRequired?: boolean;
      };
      realtime: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
        documentRejected?: boolean;
        lastAttemptWarning?: boolean;
        tradeAutoCancelled?: boolean;
        signedSpaRequired?: boolean;
      };
    };
  };
  seller: {
    _id: string;
    mail: string;
    company?: {
      companyName?: string;
      founderName?: string;
    } | null;
    notificationPreferences?: {
      email: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
        documentRejected?: boolean;
        lastAttemptWarning?: boolean;
        tradeAutoCancelled?: boolean;
        signedSpaRequired?: boolean;
      };
      realtime: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
        documentRejected?: boolean;
        lastAttemptWarning?: boolean;
        tradeAutoCancelled?: boolean;
        signedSpaRequired?: boolean;
      };
    };
  };
}

/**
 * Trade Notification Service
 * Handles sending real-time WebSocket and email notifications for trade events
 */
@Injectable()
export class TradeNotificationService {
  private readonly logger = new Logger(TradeNotificationService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly tradeGateway: TradeGateway,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences() {
    return {
      email: {
        tradeCreated: true,
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        documentsInvalidated: true,
        phaseAdvanced: true,
        tradeCompleted: true,
        tradeCancelled: true,
      },
      realtime: {
        tradeCreated: true,
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        documentsInvalidated: true,
        phaseAdvanced: true,
        tradeCompleted: true,
        tradeCancelled: true,
      },
    };
  }

  private isRealtimeEnabled(
    prefs: { realtime?: Record<string, boolean> } | undefined,
    key: string,
  ): boolean {
    return prefs?.realtime?.[key] !== false;
  }

  private getRecipientRole(
    trade: PopulatedTrade,
    recipientId: string,
  ): 'buyer' | 'seller' {
    return trade.buyer._id.toString() === recipientId ? 'buyer' : 'seller';
  }

  private getTradeTab(trade: PopulatedTrade, type: string): string {
    if (type === 'trade_created') return 'pr';
    if (
      type === 'trade_completed' ||
      type === 'trade_cancelled' ||
      type === 'trade_rejected'
    ) {
      return 'history';
    }

    const phase = trade.tradePhase;
    if (!phase || phase === 'PR') return 'pr';
    if (['COMPLETED', 'CANCELLED'].includes(phase)) return 'history';
    if (['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL'].includes(phase)) return 'spa';
    return 'ongoing';
  }

  private getActionUrl(
    trade: PopulatedTrade,
    recipientId: string,
    type: string,
  ): string {
    const role = this.getRecipientRole(trade, recipientId);
    if (type === 'counter_offer') {
      return `/${role}/negotiation/${trade._id}`;
    }
    const tab = this.getTradeTab(trade, type);
    return `/${role}/trade?tab=${tab}&tradeId=${trade._id}`;
  }

  private getFrontendBaseUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private toAbsoluteUrl(relativeUrl: string): string {
    const base = this.getFrontendBaseUrl().replace(/\/+$/, '');
    const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${base}${path}`;
  }

  /**
   * Helper to emit notification with full unread count breakdown
   * This provides granular counts for trade tab badges (pr, po, spa, ongoing, messages, total)
   */
  private async emitNotificationWithBreakdown(
    userId: string,
    notification: any,
  ): Promise<void> {
    const unreadCounts =
      await this.notificationService.getUnreadCountBreakdown(userId);
    this.tradeGateway.emitNotificationCreated(userId, {
      notification,
      unreadCount: unreadCounts.total, // Backward compatible
      unreadCounts, // New granular breakdown
    });
  }

  private getCompanyDisplayName(
    user: PopulatedTrade['buyer'] | PopulatedTrade['seller'],
  ): string {
    const companyName = user.company?.companyName?.trim();
    const founderName = user.company?.founderName?.trim();
    if (companyName) return companyName;
    if (founderName) return founderName;
    return user.mail;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private getUnitPrice(trade: PopulatedTrade): number | null {
    return (
      this.toNumber(trade.sellerOfferedPrice) ??
      this.toNumber(trade.buyerOfferedPrice) ??
      this.toNumber(trade.product.price)
    );
  }

  private getIncoterm(trade: PopulatedTrade): string | undefined {
    return (
      trade.sellerOfferedIncoterms?.selectedIncoterm ||
      trade.buyerIncoterms?.selectedIncoterm ||
      undefined
    );
  }

  private getPaymentSummary(trade: PopulatedTrade): string | undefined {
    const method = trade.paymentMethod;
    if (!method) return undefined;

    const type = method.type ? String(method.type) : 'payment';
    const channel = method.method ? String(method.method) : '';
    const percentage =
      method.percentage !== undefined ? `${method.percentage}%` : '';
    const days = method.days !== undefined ? `${method.days} days` : '';

    const parts = [type, channel, percentage, days].filter(
      (p) => p && p.trim().length > 0,
    );
    return parts.length > 0 ? parts.join(' • ') : undefined;
  }

  private buildTradeEmailContext(
    trade: PopulatedTrade,
    recipientId: string,
    type: string,
    overrides?: Partial<Record<string, unknown>>,
  ) {
    const recipientRole = this.getRecipientRole(trade, recipientId);
    const counterparty = recipientRole === 'buyer' ? trade.seller : trade.buyer;
    const unitPrice = this.getUnitPrice(trade);
    const quantity = this.toNumber(trade.quantity) ?? 0;
    const estimatedTotal =
      unitPrice !== null && quantity > 0 ? unitPrice * quantity : null;

    const relativeActionUrl = this.getActionUrl(trade, recipientId, type);

    return {
      tradeId: trade._id.toString(),
      productName: trade.product.name,
      quantity: quantity || undefined,
      quantityUnit: trade.quantityUnit,
      currency: trade.product.currency || 'USD',
      unitPrice,
      estimatedTotal,
      tradePhase: trade.tradePhase,
      incoterm: this.getIncoterm(trade),
      paymentSummary: this.getPaymentSummary(trade),
      recipientRole,
      counterpartyName: this.getCompanyDisplayName(counterparty),
      counterpartyEmail: counterparty.mail,
      actionUrl: this.toAbsoluteUrl(relativeActionUrl),
      ...overrides,
    };
  }

  /**
   * Notify when a counter offer is submitted
   */
  async notifyCounterOffer(
    trade: PopulatedTrade,
    counteringParty: 'buyer' | 'seller',
    newPrice: string,
  ): Promise<void> {
    try {
      const recipient =
        counteringParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = counteringParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'counterOffer')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'counter_offer',
          title: 'Counter Offer Received',
          message: `${sender.mail} sent a counter offer of ${newPrice} for ${trade.product.name}`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'counter_offer',
          ),
          metadata: {
            newPrice,
            productName: trade.product.name,
            counterpartyName: sender.mail,
            counteringParty,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitNegotiationUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'counter_offer',
          counteringParty,
          newPrice,
          productName: trade.product.name,
        },
      );

      // Send email notification
      if (prefs.email.counterOffer) {
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'counter_offer',
          {
            actionText: 'Review Counter Offer',
            highlight: `New offer: ${newPrice}`,
            newPrice: this.toNumber(newPrice) ?? newPrice,
            nextStep:
              'Review the counter offer and respond to continue the negotiation.',
          },
        );
        const html = emailTemplates.counterOfferReceived(
          trade.product.name,
          this.getCompanyDisplayName(sender),
          newPrice,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Counter Offer Received',
          html,
        );
      }

      this.logger.log(`Counter offer notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send counter offer notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when a trade is accepted
   */
  async notifyTradeAccepted(
    trade: PopulatedTrade,
    acceptingParty: 'buyer' | 'seller',
  ): Promise<void> {
    try {
      const recipient = acceptingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = acceptingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeAccepted')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_accepted',
          title: 'Trade Accepted',
          message: `Your trade for ${trade.product.name} has been accepted`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'trade_accepted',
          ),
          metadata: {
            productName: trade.product.name,
            acceptingParty,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'accepted',
          acceptingParty,
          productName: trade.product.name,
        },
      );

      // Send email notification
      if (prefs.email.tradeAccepted) {
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'trade_accepted',
          {
            actionText: 'View Trade Details',
            highlight: 'Status: Accepted',
            nextStep: 'Proceed to document uploads to keep the trade moving.',
          },
        );
        const html = emailTemplates.tradeAccepted(
          trade.product.name,
          this.getCompanyDisplayName(sender),
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Accepted',
          html,
        );
      }

      this.logger.log(
        `Trade accepted notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trade accepted notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when a trade is rejected
   */
  async notifyTradeRejected(
    trade: PopulatedTrade,
    rejectingParty: 'buyer' | 'seller',
    reason?: string,
  ): Promise<void> {
    try {
      const recipient = rejectingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = rejectingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeRejected')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_rejected',
          title: 'Trade Rejected',
          message: `Your trade for ${trade.product.name} has been rejected`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'trade_rejected',
          ),
          metadata: {
            productName: trade.product.name,
            rejectingParty,
            reason,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'rejected',
          rejectingParty,
          reason,
          productName: trade.product.name,
        },
      );

      // Send email notification
      if (prefs.email.tradeRejected) {
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'trade_rejected',
          {
            actionText: 'View Trade History',
            highlight: 'Status: Rejected',
            reason,
            nextStep:
              'Review the trade history and consider submitting a new request if needed.',
          },
        );
        const html = emailTemplates.tradeRejected(
          trade.product.name,
          this.getCompanyDisplayName(sender),
          reason,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Rejected',
          html,
        );
      }

      this.logger.log(
        `Trade rejected notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trade rejected notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when a document is uploaded
   */
  async notifyDocumentUploaded(
    trade: PopulatedTrade,
    documentType: string,
    uploadedBy: 'buyer' | 'seller',
  ): Promise<void> {
    try {
      const recipient = uploadedBy === 'buyer' ? trade.seller : trade.buyer;
      const sender = uploadedBy === 'buyer' ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'documentUploaded')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'document_uploaded',
          title: 'Document Uploaded',
          message: `${documentType} document uploaded for ${trade.product.name}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'document_uploaded',
          ),
          metadata: {
            productName: trade.product.name,
            documentType,
            uploadedBy,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitDocumentUploaded(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'document_uploaded',
          documentType,
          uploadedBy,
          productName: trade.product.name,
        },
      );

      // Send email notification
      if (prefs.email.documentUploaded) {
        const docTypeName = documentType.toUpperCase();
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'document_uploaded',
          {
            actionText: 'Review Document',
            highlight: `Document: ${docTypeName}`,
            documentType: docTypeName,
            nextStep:
              'Review and verify the document so the trade can advance.',
          },
        );
        const html = emailTemplates.documentUploaded(
          trade.product.name,
          documentType,
          this.getCompanyDisplayName(sender),
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Document Uploaded',
          html,
        );
      }

      this.logger.log(
        `Document uploaded notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send document uploaded notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when trade phase advances
   */
  async notifyPhaseAdvanced(
    trade: PopulatedTrade,
    newPhase: string,
  ): Promise<void> {
    try {
      // Notify both parties
      const buyerPrefs =
        trade.buyer.notificationPreferences || this.getDefaultPreferences();
      const sellerPrefs =
        trade.seller.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(buyerPrefs, 'phaseAdvanced')) {
        // Notify Buyer (Persistent)
        const buyerNotification =
          await this.notificationService.createNotification({
            userId: trade.buyer._id.toString(),
            type: 'phase_advanced',
            title: 'Trade Phase Updated',
            message: `Trade for ${trade.product.name} advanced to ${newPhase}`,
            priority: 'normal',
            tradeId: trade._id.toString(),
            actionUrl: this.getActionUrl(
              trade,
              trade.buyer._id.toString(),
              'phase_advanced',
            ),
            metadata: {
              productName: trade.product.name,
              newPhase,
            },
          });
        await this.emitNotificationWithBreakdown(
          trade.buyer._id.toString(),
          buyerNotification,
        );
      }

      if (this.isRealtimeEnabled(sellerPrefs, 'phaseAdvanced')) {
        // Notify Seller (Persistent)
        const sellerNotification =
          await this.notificationService.createNotification({
            userId: trade.seller._id.toString(),
            type: 'phase_advanced',
            title: 'Trade Phase Updated',
            message: `Trade for ${trade.product.name} advanced to ${newPhase}`,
            priority: 'normal',
            tradeId: trade._id.toString(),
            actionUrl: this.getActionUrl(
              trade,
              trade.seller._id.toString(),
              'phase_advanced',
            ),
            metadata: {
              productName: trade.product.name,
              newPhase,
            },
          });
        await this.emitNotificationWithBreakdown(
          trade.seller._id.toString(),
          sellerNotification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'phase_advanced',
          newPhase,
          productName: trade.product.name,
        },
      );

      // Send email to buyer
      if (buyerPrefs.email.phaseAdvanced) {
        const buyerContext = this.buildTradeEmailContext(
          trade,
          trade.buyer._id.toString(),
          'phase_advanced',
          {
            actionText: 'View Trade Progress',
            highlight: `Current Phase: ${newPhase}`,
            tradePhase: newPhase,
            nextStep:
              'Complete the requirements for this phase to keep the trade moving.',
          },
        );
        const html = emailTemplates.phaseAdvanced(
          trade.product.name,
          newPhase,
          buyerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Trade Phase Updated',
          html,
        );
      }

      // Send email to seller
      if (sellerPrefs.email.phaseAdvanced) {
        const sellerContext = this.buildTradeEmailContext(
          trade,
          trade.seller._id.toString(),
          'phase_advanced',
          {
            actionText: 'View Trade Progress',
            highlight: `Current Phase: ${newPhase}`,
            tradePhase: newPhase,
            nextStep:
              'Complete the requirements for this phase to keep the trade moving.',
          },
        );
        const html = emailTemplates.phaseAdvanced(
          trade.product.name,
          newPhase,
          sellerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          'Trade Phase Updated',
          html,
        );
      }

      this.logger.log(
        `Phase advanced notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send phase advanced notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when trade is completed
   */
  async notifyTradeCompleted(
    trade: PopulatedTrade,
    totalAmount: string,
  ): Promise<void> {
    try {
      // Notify both parties
      const buyerPrefs =
        trade.buyer.notificationPreferences || this.getDefaultPreferences();
      const sellerPrefs =
        trade.seller.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(buyerPrefs, 'tradeCompleted')) {
        // Notify Buyer (Persistent)
        const buyerNotification =
          await this.notificationService.createNotification({
            userId: trade.buyer._id.toString(),
            type: 'trade_completed',
            title: 'Trade Completed',
            message: `Trade for ${trade.product.name} has been completed. Total: ${totalAmount}`,
            priority: 'low',
            tradeId: trade._id.toString(),
            actionUrl: this.getActionUrl(
              trade,
              trade.buyer._id.toString(),
              'trade_completed',
            ),
            metadata: {
              productName: trade.product.name,
              totalAmount,
            },
          });
        await this.emitNotificationWithBreakdown(
          trade.buyer._id.toString(),
          buyerNotification,
        );
      }

      if (this.isRealtimeEnabled(sellerPrefs, 'tradeCompleted')) {
        // Notify Seller (Persistent)
        const sellerNotification =
          await this.notificationService.createNotification({
            userId: trade.seller._id.toString(),
            type: 'trade_completed',
            title: 'Trade Completed',
            message: `Trade for ${trade.product.name} has been completed. Total: ${totalAmount}`,
            priority: 'low',
            tradeId: trade._id.toString(),
            actionUrl: this.getActionUrl(
              trade,
              trade.seller._id.toString(),
              'trade_completed',
            ),
            metadata: {
              productName: trade.product.name,
              totalAmount,
            },
          });
        await this.emitNotificationWithBreakdown(
          trade.seller._id.toString(),
          sellerNotification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'completed',
          totalAmount,
          productName: trade.product.name,
        },
      );

      // Send email to buyer
      if (buyerPrefs.email.tradeCompleted) {
        const buyerContext = this.buildTradeEmailContext(
          trade,
          trade.buyer._id.toString(),
          'trade_completed',
          {
            actionText: 'View Invoice',
            highlight: `Total: ${totalAmount}`,
            totalAmount,
            tradePhase: 'COMPLETED',
            nextStep: 'Download your invoice and keep a copy for your records.',
          },
        );
        const html = emailTemplates.tradeCompleted(
          trade.product.name,
          totalAmount,
          buyerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Trade Completed',
          html,
        );
      }

      // Send email to seller
      if (sellerPrefs.email.tradeCompleted) {
        const sellerContext = this.buildTradeEmailContext(
          trade,
          trade.seller._id.toString(),
          'trade_completed',
          {
            actionText: 'View Invoice',
            highlight: `Total: ${totalAmount}`,
            totalAmount,
            tradePhase: 'COMPLETED',
            nextStep: 'Download your invoice and keep a copy for your records.',
          },
        );
        const html = emailTemplates.tradeCompleted(
          trade.product.name,
          totalAmount,
          sellerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          'Trade Completed',
          html,
        );
      }

      this.logger.log(
        `Trade completed notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trade completed notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when documents are invalidated due to a previous document being replaced
   * This notifies the buyer when seller replaces SCO (their ICPO is invalidated)
   * Or notifies both parties when ICPO is replaced (SPA and beyond are invalidated)
   */
  async notifyDocumentsInvalidated(
    trade: PopulatedTrade,
    replacedDocumentType: string,
    invalidatedDocuments: string[],
  ): Promise<void> {
    try {
      // Determine who needs to be notified based on which document was replaced
      // If SCO was replaced, notify the buyer (their ICPO was invalidated)
      // If ICPO was replaced, notify the seller (SPA etc. need re-upload)
      const isSCOReplaced = replacedDocumentType === 'SCO';
      const recipient = isSCOReplaced ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'documentsInvalidated')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'documents_invalidated',
          title: 'Documents Invalidated',
          message: `${replacedDocumentType} replacement invalidated: ${invalidatedDocuments.join(', ')}`,
          priority: 'urgent',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'documents_invalidated',
          ),
          metadata: {
            productName: trade.product.name,
            replacedDocumentType,
            invalidatedDocuments,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'documents_invalidated',
          replacedDocumentType,
          invalidatedDocuments,
          productName: trade.product.name,
        },
      );

      // Send email notification
      if (prefs.email.documentsInvalidated) {
        const docList = invalidatedDocuments.join(', ');
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'documents_invalidated',
          {
            actionText: 'View Trade',
            highlight: `Replaced: ${replacedDocumentType}`,
            replacedDocumentType,
            invalidatedDocuments: docList,
            nextStep:
              'Re-upload the invalidated documents listed below to continue.',
          },
        );
        const html = emailTemplates.documentsInvalidated(
          trade.product.name,
          replacedDocumentType,
          invalidatedDocuments,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Action Required: Documents Need Re-submission',
          html,
        );
      }

      this.logger.log(
        `Documents invalidated notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send documents invalidated notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify seller when a new trade request is created
   */
  async notifyTradeCreated(trade: PopulatedTrade): Promise<void> {
    try {
      const recipient = trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeCreated')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_created',
          title: 'New Purchase Request',
          message: `${trade.buyer.mail} submitted a purchase request for ${trade.product.name}`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'trade_created',
          ),
          metadata: {
            productName: trade.product.name,
            buyerName: trade.buyer.mail,
          },
        });

        // Emit notification with full breakdown for tab badges
        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'created',
          productName: trade.product.name,
        },
      );

      // Send email notification to seller
      if (prefs.email.tradeCreated !== false) {
        const offeredPriceText =
          trade.buyerOfferedPrice !== undefined
            ? String(trade.buyerOfferedPrice)
            : undefined;
        const highlightText = offeredPriceText
          ? `Offered price: ${offeredPriceText}`
          : `Quantity: ${trade.quantity} ${trade.quantityUnit}`;
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'trade_created',
          {
            actionText: 'Review Request',
            highlight: highlightText,
            buyerOfferedPrice: trade.buyerOfferedPrice,
            nextStep:
              'Review the purchase request and respond to start the negotiation.',
          },
        );
        const html = emailTemplates.tradeCreated(
          trade.product.name,
          this.getCompanyDisplayName(trade.buyer),
          `${trade.quantity} ${trade.quantityUnit}`,
          offeredPriceText,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Purchase Request Received',
          html,
        );
      }

      this.logger.log(`Trade created notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send trade created notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when a trade is cancelled
   */
  async notifyTradeCancelled(
    trade: PopulatedTrade,
    cancellingParty: 'buyer' | 'seller',
    reason?: string,
  ): Promise<void> {
    try {
      const recipient =
        cancellingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = cancellingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeCancelled')) {
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_cancelled',
          title: 'Trade Cancelled',
          message: `Trade for ${trade.product.name} was cancelled${reason ? `: ${reason}` : ''}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            recipient._id.toString(),
            'trade_cancelled',
          ),
          metadata: {
            productName: trade.product.name,
            cancellingParty,
            reason,
          },
        });

        await this.emitNotificationWithBreakdown(
          recipient._id.toString(),
          notification,
        );
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'cancelled',
          cancellingParty,
          reason,
          productName: trade.product.name,
        },
      );

      if (prefs.email.tradeCancelled) {
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'trade_cancelled',
          {
            actionText: 'View Trade History',
            highlight: 'Status: Cancelled',
            reason,
            tradePhase: 'CANCELLED',
            nextStep:
              'Check the trade history for details and decide your next move.',
          },
        );
        const html = emailTemplates.tradeRejected(
          trade.product.name,
          this.getCompanyDisplayName(sender),
          reason,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Cancelled',
          html,
        );
      }

      this.logger.log(
        `Trade cancelled notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trade cancelled notification: ${error.message}`,
      );
    }
  }

  // ========================
  // PHASE 2 REFACTORING: New Notification Methods
  // ========================

  /**
   * Notify when a document is rejected
   * Includes remaining attempts info and encourages communication
   */
  async notifyDocumentRejected(
    trade: PopulatedTrade,
    documentType: string,
    reason: string,
    remainingAttempts: number,
  ): Promise<void> {
    try {
      // Determine who uploaded the document (recipient of rejection notification)
      // SCO/SPA/BoL uploaded by seller, ICPO/payment-proof/signed-spa uploaded by buyer
      const uploaderIsBuyer = ['icpo', 'payment-proof', 'signed-spa'].includes(
        documentType.toLowerCase(),
      );
      const recipient = uploaderIsBuyer ? trade.buyer : trade.seller;
      const verifier = uploaderIsBuyer ? trade.seller : trade.buyer;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      // Create persistent notification
      const notification = await this.notificationService.createNotification({
        userId: recipient._id.toString(),
        type: 'document_rejected',
        title: 'Document Rejected',
        message: `Your ${documentType.toUpperCase()} was rejected. ${remainingAttempts} attempts remaining.`,
        priority: remainingAttempts === 1 ? 'urgent' : 'high',
        tradeId: trade._id.toString(),
        actionUrl: this.getActionUrl(
          trade,
          recipient._id.toString(),
          'document_rejected',
        ),
        metadata: {
          productName: trade.product.name,
          documentType,
          reason,
          remainingAttempts,
        },
      });

      await this.emitNotificationWithBreakdown(
        recipient._id.toString(),
        notification,
      );

      // Send email
      if (prefs.email.documentUploaded !== false) {
        const docTypeName = documentType.toUpperCase();
        const context = this.buildTradeEmailContext(
          trade,
          recipient._id.toString(),
          'document_rejected',
          {
            actionText: 'Re-upload Document',
            highlight: `Remaining attempts: ${remainingAttempts}`,
            documentType: docTypeName,
            reason,
            remainingAttempts,
            nextStep:
              remainingAttempts === 1
                ? 'Your next upload is the final attempt. Review the feedback carefully.'
                : 'Review the feedback and re-upload a corrected document.',
          },
        );
        const html = emailTemplates.documentRejected(
          trade.product.name,
          documentType,
          reason,
          remainingAttempts,
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Document Rejected - Action Required',
          html,
        );
      }

      this.logger.log(
        `Document rejection notification sent for trade ${trade._id} - ${documentType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send document rejection notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify when only one upload attempt remains (final warning)
   */
  async notifyLastAttemptWarning(
    trade: PopulatedTrade,
    documentType: string,
  ): Promise<void> {
    try {
      // Determine who uploaded the document
      const uploaderIsBuyer = ['icpo', 'payment-proof', 'signed-spa'].includes(
        documentType.toLowerCase(),
      );
      const recipient = uploaderIsBuyer ? trade.buyer : trade.seller;
      const prefs =
        recipient.notificationPreferences || this.getDefaultPreferences();

      // Create urgent notification
      const notification = await this.notificationService.createNotification({
        userId: recipient._id.toString(),
        type: 'last_attempt_warning',
        title: '⚠️ Final Attempt Warning',
        message: `Your next ${documentType.toUpperCase()} upload will be your FINAL attempt.`,
        priority: 'urgent',
        tradeId: trade._id.toString(),
        actionUrl: this.getActionUrl(
          trade,
          recipient._id.toString(),
          'last_attempt_warning',
        ),
        metadata: {
          productName: trade.product.name,
          documentType,
        },
      });

      await this.emitNotificationWithBreakdown(
        recipient._id.toString(),
        notification,
      );

      // Send warning email
      const docTypeName = documentType.toUpperCase();
      const context = this.buildTradeEmailContext(
        trade,
        recipient._id.toString(),
        'last_attempt_warning',
        {
          actionText: 'View Requirements',
          highlight: 'Final attempt remaining',
          documentType: docTypeName,
          remainingAttempts: 1,
          nextStep:
            'Double-check the requirements before uploading to avoid cancellation.',
        },
      );
      const html = emailTemplates.lastAttemptWarning(
        trade.product.name,
        documentType,
        context,
      );
      await this.mailService.sendTradeNotificationEmail(
        recipient.mail,
        '⚠️ Final Upload Attempt Warning',
        html,
      );

      this.logger.log(
        `Last attempt warning sent for trade ${trade._id} - ${documentType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send last attempt warning: ${error.message}`,
      );
    }
  }

  /**
   * Notify both parties when a trade is auto-cancelled due to document rejection limits
   */
  async notifyTradeAutoCancelled(
    trade: PopulatedTrade,
    reason: string,
  ): Promise<void> {
    try {
      const buyerPrefs =
        trade.buyer.notificationPreferences || this.getDefaultPreferences();
      const sellerPrefs =
        trade.seller.notificationPreferences || this.getDefaultPreferences();

      // Notify Buyer
      const buyerNotification =
        await this.notificationService.createNotification({
          userId: trade.buyer._id.toString(),
          type: 'trade_auto_cancelled',
          title: 'Trade Auto-Cancelled',
          message: `Trade for ${trade.product.name} was automatically cancelled.`,
          priority: 'urgent',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            trade.buyer._id.toString(),
            'trade_auto_cancelled',
          ),
          metadata: {
            productName: trade.product.name,
            reason,
            disputeEligible: true,
          },
        });
      await this.emitNotificationWithBreakdown(
        trade.buyer._id.toString(),
        buyerNotification,
      );

      // Notify Seller
      const sellerNotification =
        await this.notificationService.createNotification({
          userId: trade.seller._id.toString(),
          type: 'trade_auto_cancelled',
          title: 'Trade Auto-Cancelled',
          message: `Trade for ${trade.product.name} was automatically cancelled.`,
          priority: 'urgent',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(
            trade,
            trade.seller._id.toString(),
            'trade_auto_cancelled',
          ),
          metadata: {
            productName: trade.product.name,
            reason,
            disputeEligible: true,
          },
        });
      await this.emitNotificationWithBreakdown(
        trade.seller._id.toString(),
        sellerNotification,
      );

      // Send real-time update
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'auto_cancelled',
          reason,
          productName: trade.product.name,
        },
      );

      // Send emails to both parties
      if (buyerPrefs.email.tradeCancelled !== false) {
        const buyerContext = this.buildTradeEmailContext(
          trade,
          trade.buyer._id.toString(),
          'trade_auto_cancelled',
          {
            actionText: 'View Trade History',
            highlight: 'Status: Auto-cancelled',
            reason,
            tradePhase: 'CANCELLED',
            nextStep:
              'You can raise a dispute within 30 days if you believe this was an error.',
          },
        );
        const buyerHtml = emailTemplates.tradeAutoCancelled(
          trade.product.name,
          reason,
          buyerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Trade Automatically Cancelled',
          buyerHtml,
        );
      }

      if (sellerPrefs.email.tradeCancelled !== false) {
        const sellerContext = this.buildTradeEmailContext(
          trade,
          trade.seller._id.toString(),
          'trade_auto_cancelled',
          {
            actionText: 'View Trade History',
            highlight: 'Status: Auto-cancelled',
            reason,
            tradePhase: 'CANCELLED',
            nextStep:
              'You can raise a dispute within 30 days if you believe this was an error.',
          },
        );
        const sellerHtml = emailTemplates.tradeAutoCancelled(
          trade.product.name,
          reason,
          sellerContext,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          'Trade Automatically Cancelled',
          sellerHtml,
        );
      }

      this.logger.log(
        `Trade auto-cancellation notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trade auto-cancellation notification: ${error.message}`,
      );
    }
  }

  /**
   * Notify buyer when seller's SPA is approved - prompts them to upload signed SPA
   */
  async notifySignedSpaRequired(trade: PopulatedTrade): Promise<void> {
    try {
      const prefs =
        trade.buyer.notificationPreferences || this.getDefaultPreferences();

      // Create notification
      const notification = await this.notificationService.createNotification({
        userId: trade.buyer._id.toString(),
        type: 'signed_spa_required',
        title: 'Action Required: Upload Signed SPA',
        message: `The seller's SPA for ${trade.product.name} has been approved. Upload your signed copy.`,
        priority: 'high',
        tradeId: trade._id.toString(),
        actionUrl: this.getActionUrl(
          trade,
          trade.buyer._id.toString(),
          'signed_spa_required',
        ),
        metadata: {
          productName: trade.product.name,
          sellerName: trade.seller.mail,
        },
      });

      await this.emitNotificationWithBreakdown(
        trade.buyer._id.toString(),
        notification,
      );

      // Send email
      if (prefs.email.documentUploaded !== false) {
        const context = this.buildTradeEmailContext(
          trade,
          trade.buyer._id.toString(),
          'signed_spa_required',
          {
            actionText: 'Upload Signed SPA',
            highlight: 'Next step: Upload signed SPA',
            tradePhase: trade.tradePhase || 'SPA',
            nextStep:
              'Upload your signed SPA so the trade can advance to payment verification.',
          },
        );
        const html = emailTemplates.signedSpaRequired(
          trade.product.name,
          this.getCompanyDisplayName(trade.seller),
          context,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Action Required: Upload Signed SPA',
          html,
        );
      }

      this.logger.log(
        `Signed SPA required notification sent for trade ${trade._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send signed SPA required notification: ${error.message}`,
      );
    }
  }

  // ========================
  // NEGOTIATION COUNTER LIMIT NOTIFICATIONS
  // ========================

  /**
   * Notify buyer when they're on their last counter opportunity
   * Called after buyer's first counter (1 remaining)
   */
  async notifyLastCounterWarning(
    trade: PopulatedTrade,
    countersUsed: number,
    maxCounters: number,
  ): Promise<void> {
    try {
      const prefs =
        trade.buyer.notificationPreferences || this.getDefaultPreferences();

      // Create urgent notification for buyer
      const notification = await this.notificationService.createNotification({
        userId: trade.buyer._id.toString(),
        type: 'last_counter_warning',
        title: '⚠️ Last Counter Opportunity',
        message: `You have used ${countersUsed} of ${maxCounters} counters for ${trade.product.name}. Your next response will be your FINAL offer.`,
        priority: 'urgent',
        tradeId: trade._id.toString(),
        actionUrl: this.getActionUrl(
          trade,
          trade.buyer._id.toString(),
          'last_counter_warning',
        ),
        metadata: {
          productName: trade.product.name,
          countersUsed,
          maxCounters,
          remainingCounters: maxCounters - countersUsed,
        },
      });

      await this.emitNotificationWithBreakdown(
        trade.buyer._id.toString(),
        notification,
      );

      // Send email warning
      if (prefs.email.counterOffer !== false) {
        const html = emailTemplates.lastCounterWarning(
          trade.product.name,
          trade.seller.mail,
          countersUsed,
          maxCounters,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          '⚠️ Last Counter Opportunity - Action Required',
          html,
        );
      }

      this.logger.log(
        `Last counter warning sent for trade ${trade._id} - Counter ${countersUsed}/${maxCounters}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send last counter warning: ${error.message}`,
      );
    }
  }

  /**
   * Notify seller when buyer has submitted their final offer
   * Seller can now only Accept or Reject - no more counter-offers allowed
   */
  async notifyFinalOffer(
    trade: PopulatedTrade,
    finalPrice: string | number,
  ): Promise<void> {
    try {
      const prefs =
        trade.seller.notificationPreferences || this.getDefaultPreferences();
      const priceDisplay =
        typeof finalPrice === 'number' ? String(finalPrice) : finalPrice;

      // Create high-priority notification for seller
      const notification = await this.notificationService.createNotification({
        userId: trade.seller._id.toString(),
        type: 'final_offer_notification',
        title: '🔔 Final Offer Received',
        message: `${trade.buyer.mail} has submitted their final offer of ${priceDisplay} for ${trade.product.name}. You can only Accept or Reject.`,
        priority: 'high',
        tradeId: trade._id.toString(),
        actionUrl: this.getActionUrl(
          trade,
          trade.seller._id.toString(),
          'final_offer_notification',
        ),
        metadata: {
          productName: trade.product.name,
          buyerName: trade.buyer.mail,
          finalPrice: priceDisplay,
          canCounter: false,
        },
      });

      await this.emitNotificationWithBreakdown(
        trade.seller._id.toString(),
        notification,
      );

      // Send real-time update indicating negotiation is locked
      this.tradeGateway.emitNegotiationUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'negotiation_locked',
          finalPrice: priceDisplay,
          productName: trade.product.name,
          message:
            'Buyer has used all counter opportunities. Accept or Reject only.',
        },
      );

      // Send email to seller
      if (prefs.email.counterOffer !== false) {
        const html = emailTemplates.finalOfferNotification(
          trade.product.name,
          trade.buyer.mail,
          priceDisplay,
        );
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          '🔔 Final Offer - Decision Required',
          html,
        );
      }

      this.logger.log(`Final offer notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send final offer notification: ${error.message}`,
      );
    }
  }
}
