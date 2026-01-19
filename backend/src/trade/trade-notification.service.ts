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
    price: string;
    currency: string;
  };
  buyer: {
    _id: string;
    mail: string;
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
      };
    };
  };
  seller: {
    _id: string;
    mail: string;
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
  ) { }

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
    key: string
  ): boolean {
    return prefs?.realtime?.[key] !== false;
  }

  private getRecipientRole(trade: PopulatedTrade, recipientId: string): 'buyer' | 'seller' {
    return trade.buyer._id.toString() === recipientId ? 'buyer' : 'seller';
  }

  private getTradeTab(trade: PopulatedTrade, type: string): string {
    if (type === 'trade_created') return 'pr';
    if (type === 'trade_completed' || type === 'trade_cancelled' || type === 'trade_rejected') {
      return 'history';
    }

    const phase = trade.tradePhase;
    if (!phase || phase === 'PR') return 'pr';
    if (['COMPLETED', 'CANCELLED'].includes(phase)) return 'history';
    if (['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL'].includes(phase)) return 'spa';
    return 'ongoing';
  }

  private getActionUrl(trade: PopulatedTrade, recipientId: string, type: string): string {
    const role = this.getRecipientRole(trade, recipientId);
    if (type === 'counter_offer') {
      return `/${role}/negotiation/${trade._id}`;
    }
    const tab = this.getTradeTab(trade, type);
    return `/${role}/trade?tab=${tab}&tradeId=${trade._id}`;
  }

  /**
   * Notify when a counter offer is submitted
   */
  async notifyCounterOffer(
    trade: PopulatedTrade,
    counteringParty: 'buyer' | 'seller',
    newPrice: string
  ): Promise<void> {
    try {
      const recipient = counteringParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = counteringParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'counterOffer')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'counter_offer',
          title: 'Counter Offer Received',
          message: `${sender.mail} sent a counter offer of ${newPrice} for ${trade.product.name}`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'counter_offer'),
          metadata: {
            newPrice,
            productName: trade.product.name,
            counterpartyName: sender.mail,
            counteringParty,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      // Send email notification
      if (prefs.email.counterOffer) {
        const html = emailTemplates.counterOfferReceived(
          trade.product.name,
          sender.mail,
          newPrice
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Counter Offer Received',
          html
        );
      }

      this.logger.log(`Counter offer notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send counter offer notification: ${error.message}`);
    }
  }

  /**
   * Notify when a trade is accepted
   */
  async notifyTradeAccepted(
    trade: PopulatedTrade,
    acceptingParty: 'buyer' | 'seller'
  ): Promise<void> {
    try {
      const recipient = acceptingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = acceptingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeAccepted')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_accepted',
          title: 'Trade Accepted',
          message: `Your trade for ${trade.product.name} has been accepted`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'trade_accepted'),
          metadata: {
            productName: trade.product.name,
            acceptingParty,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      // Send email notification
      if (prefs.email.tradeAccepted) {
        const html = emailTemplates.tradeAccepted(trade.product.name, sender.mail);
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Accepted',
          html
        );
      }

      this.logger.log(`Trade accepted notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send trade accepted notification: ${error.message}`);
    }
  }

  /**
   * Notify when a trade is rejected
   */
  async notifyTradeRejected(
    trade: PopulatedTrade,
    rejectingParty: 'buyer' | 'seller',
    reason?: string
  ): Promise<void> {
    try {
      const recipient = rejectingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = rejectingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeRejected')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_rejected',
          title: 'Trade Rejected',
          message: `Your trade for ${trade.product.name} has been rejected`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'trade_rejected'),
          metadata: {
            productName: trade.product.name,
            rejectingParty,
            reason,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      // Send email notification
      if (prefs.email.tradeRejected) {
        const html = emailTemplates.tradeRejected(trade.product.name, sender.mail, reason);
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Rejected',
          html
        );
      }

      this.logger.log(`Trade rejected notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send trade rejected notification: ${error.message}`);
    }
  }

  /**
   * Notify when a document is uploaded
   */
  async notifyDocumentUploaded(
    trade: PopulatedTrade,
    documentType: string,
    uploadedBy: 'buyer' | 'seller'
  ): Promise<void> {
    try {
      const recipient = uploadedBy === 'buyer' ? trade.seller : trade.buyer;
      const sender = uploadedBy === 'buyer' ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'documentUploaded')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'document_uploaded',
          title: 'Document Uploaded',
          message: `${documentType} document uploaded for ${trade.product.name}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'document_uploaded'),
          metadata: {
            productName: trade.product.name,
            documentType,
            uploadedBy,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      // Send email notification
      if (prefs.email.documentUploaded) {
        const html = emailTemplates.documentUploaded(
          trade.product.name,
          documentType,
          sender.mail
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Document Uploaded',
          html
        );
      }

      this.logger.log(`Document uploaded notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send document uploaded notification: ${error.message}`);
    }
  }

  /**
   * Notify when trade phase advances
   */
  async notifyPhaseAdvanced(trade: PopulatedTrade, newPhase: string): Promise<void> {
    try {
      // Notify both parties
      const buyerPrefs = trade.buyer.notificationPreferences || this.getDefaultPreferences();
      const sellerPrefs = trade.seller.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(buyerPrefs, 'phaseAdvanced')) {
        // Notify Buyer (Persistent)
        const buyerNotification = await this.notificationService.createNotification({
          userId: trade.buyer._id.toString(),
          type: 'phase_advanced',
          title: 'Trade Phase Updated',
          message: `Trade for ${trade.product.name} advanced to ${newPhase}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, trade.buyer._id.toString(), 'phase_advanced'),
          metadata: {
            productName: trade.product.name,
            newPhase,
          }
        });
        const buyerUnreadCount = await this.notificationService.getUnreadCount(trade.buyer._id.toString());
        this.tradeGateway.emitNotificationCreated(trade.buyer._id.toString(), {
          notification: buyerNotification,
          unreadCount: buyerUnreadCount,
        });
      }

      if (this.isRealtimeEnabled(sellerPrefs, 'phaseAdvanced')) {
        // Notify Seller (Persistent)
        const sellerNotification = await this.notificationService.createNotification({
          userId: trade.seller._id.toString(),
          type: 'phase_advanced',
          title: 'Trade Phase Updated',
          message: `Trade for ${trade.product.name} advanced to ${newPhase}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, trade.seller._id.toString(), 'phase_advanced'),
          metadata: {
            productName: trade.product.name,
            newPhase,
          }
        });
        const sellerUnreadCount = await this.notificationService.getUnreadCount(trade.seller._id.toString());
        this.tradeGateway.emitNotificationCreated(trade.seller._id.toString(), {
          notification: sellerNotification,
          unreadCount: sellerUnreadCount,
        });
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
        }
      );

      // Send email to buyer
      if (buyerPrefs.email.phaseAdvanced) {
        const html = emailTemplates.phaseAdvanced(trade.product.name, newPhase);
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Trade Phase Updated',
          html
        );
      }

      // Send email to seller
      if (sellerPrefs.email.phaseAdvanced) {
        const html = emailTemplates.phaseAdvanced(trade.product.name, newPhase);
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          'Trade Phase Updated',
          html
        );
      }

      this.logger.log(`Phase advanced notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send phase advanced notification: ${error.message}`);
    }
  }

  /**
   * Notify when trade is completed
   */
  async notifyTradeCompleted(trade: PopulatedTrade, totalAmount: string): Promise<void> {
    try {
      // Notify both parties
      const buyerPrefs = trade.buyer.notificationPreferences || this.getDefaultPreferences();
      const sellerPrefs = trade.seller.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(buyerPrefs, 'tradeCompleted')) {
        // Notify Buyer (Persistent)
        const buyerNotification = await this.notificationService.createNotification({
          userId: trade.buyer._id.toString(),
          type: 'trade_completed',
          title: 'Trade Completed',
          message: `Trade for ${trade.product.name} has been completed. Total: ${totalAmount}`,
          priority: 'low',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, trade.buyer._id.toString(), 'trade_completed'),
          metadata: {
            productName: trade.product.name,
            totalAmount,
          }
        });
        const buyerUnreadCount = await this.notificationService.getUnreadCount(trade.buyer._id.toString());
        this.tradeGateway.emitNotificationCreated(trade.buyer._id.toString(), {
          notification: buyerNotification,
          unreadCount: buyerUnreadCount,
        });
      }

      if (this.isRealtimeEnabled(sellerPrefs, 'tradeCompleted')) {
        // Notify Seller (Persistent)
        const sellerNotification = await this.notificationService.createNotification({
          userId: trade.seller._id.toString(),
          type: 'trade_completed',
          title: 'Trade Completed',
          message: `Trade for ${trade.product.name} has been completed. Total: ${totalAmount}`,
          priority: 'low',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, trade.seller._id.toString(), 'trade_completed'),
          metadata: {
            productName: trade.product.name,
            totalAmount,
          }
        });
        const sellerUnreadCount = await this.notificationService.getUnreadCount(trade.seller._id.toString());
        this.tradeGateway.emitNotificationCreated(trade.seller._id.toString(), {
          notification: sellerNotification,
          unreadCount: sellerUnreadCount,
        });
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
        }
      );

      // Send email to buyer
      if (buyerPrefs.email.tradeCompleted) {
        const html = emailTemplates.tradeCompleted(trade.product.name, totalAmount);
        await this.mailService.sendTradeNotificationEmail(
          trade.buyer.mail,
          'Trade Completed',
          html
        );
      }

      // Send email to seller
      if (sellerPrefs.email.tradeCompleted) {
        const html = emailTemplates.tradeCompleted(trade.product.name, totalAmount);
        await this.mailService.sendTradeNotificationEmail(
          trade.seller.mail,
          'Trade Completed',
          html
        );
      }

      this.logger.log(`Trade completed notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send trade completed notification: ${error.message}`);
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
    invalidatedDocuments: string[]
  ): Promise<void> {
    try {
      // Determine who needs to be notified based on which document was replaced
      // If SCO was replaced, notify the buyer (their ICPO was invalidated)
      // If ICPO was replaced, notify the seller (SPA etc. need re-upload)
      const isSCOReplaced = replacedDocumentType === 'SCO';
      const recipient = isSCOReplaced ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'documentsInvalidated')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'documents_invalidated',
          title: 'Documents Invalidated',
          message: `${replacedDocumentType} replacement invalidated: ${invalidatedDocuments.join(', ')}`,
          priority: 'urgent',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'documents_invalidated'),
          metadata: {
            productName: trade.product.name,
            replacedDocumentType,
            invalidatedDocuments,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      // Send email notification
      if (prefs.email.documentsInvalidated) {
        const html = emailTemplates.documentsInvalidated(
          trade.product.name,
          replacedDocumentType,
          invalidatedDocuments
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Action Required: Documents Need Re-submission',
          html
        );
      }

      this.logger.log(`Documents invalidated notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send documents invalidated notification: ${error.message}`);
    }
  }

  /**
   * Notify seller when a new trade request is created
   */
  async notifyTradeCreated(trade: PopulatedTrade): Promise<void> {
    try {
      const recipient = trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeCreated')) {
        // Create persistent notification
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_created',
          title: 'New Purchase Request',
          message: `${trade.buyer.mail} submitted a purchase request for ${trade.product.name}`,
          priority: 'high',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'trade_created'),
          metadata: {
            productName: trade.product.name,
            buyerName: trade.buyer.mail,
          }
        });

        // Get updated unread count and emit
        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
      }

      // Send real-time update for live trade views
      this.tradeGateway.emitTradeUpdate(
        trade._id.toString(),
        trade.buyer._id.toString(),
        trade.seller._id.toString(),
        {
          action: 'created',
          productName: trade.product.name,
        }
      );

      // Send email notification to seller
      if (prefs.email.tradeCreated !== false) {
        const html = emailTemplates.tradeCreated(
          trade.product.name,
          trade.buyer.mail,
          `${trade.quantity} ${trade.quantityUnit}`,
          trade.buyerOfferedPrice !== undefined ? String(trade.buyerOfferedPrice) : undefined
        );
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'New Purchase Request Received',
          html
        );
      }

      this.logger.log(`Trade created notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send trade created notification: ${error.message}`);
    }
  }

  /**
   * Notify when a trade is cancelled
   */
  async notifyTradeCancelled(
    trade: PopulatedTrade,
    cancellingParty: 'buyer' | 'seller',
    reason?: string
  ): Promise<void> {
    try {
      const recipient = cancellingParty === 'buyer' ? trade.seller : trade.buyer;
      const sender = cancellingParty === 'buyer' ? trade.buyer : trade.seller;
      const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

      if (this.isRealtimeEnabled(prefs, 'tradeCancelled')) {
        const notification = await this.notificationService.createNotification({
          userId: recipient._id.toString(),
          type: 'trade_cancelled',
          title: 'Trade Cancelled',
          message: `Trade for ${trade.product.name} was cancelled${reason ? `: ${reason}` : ''}`,
          priority: 'normal',
          tradeId: trade._id.toString(),
          actionUrl: this.getActionUrl(trade, recipient._id.toString(), 'trade_cancelled'),
          metadata: {
            productName: trade.product.name,
            cancellingParty,
            reason,
          }
        });

        const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
        this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
          notification,
          unreadCount,
        });
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
        }
      );

      if (prefs.email.tradeCancelled) {
        const html = emailTemplates.tradeRejected(trade.product.name, sender.mail, reason);
        await this.mailService.sendTradeNotificationEmail(
          recipient.mail,
          'Trade Cancelled',
          html
        );
      }

      this.logger.log(`Trade cancelled notification sent for trade ${trade._id}`);
    } catch (error) {
      this.logger.error(`Failed to send trade cancelled notification: ${error.message}`);
    }
  }
}
