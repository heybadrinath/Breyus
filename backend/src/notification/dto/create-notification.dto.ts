import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsBoolean,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
} from '../schema/notification.schema';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum([
    'trade_created',
    'counter_offer',
    'trade_accepted',
    'trade_rejected',
    'document_uploaded',
    'documents_invalidated',
    'phase_advanced',
    'trade_completed',
    'trade_cancelled',
    'new_message',
    'analysis_completed',
    // Admin actions
    'account_suspended',
    'account_unsuspended',
    'password_reset_required',
    // KYC notifications
    'kyc_document_approved',
    'kyc_document_rejected',
    'company_kyc_verified',
    // Dispute notifications
    'dispute_created',
    'dispute_resolved',
    'dispute_message',
    'dispute_assigned',
    'dispute_status_updated',
    // PHASE 2 REFACTORING: Document rejection tracking notifications
    'document_rejected',
    'last_attempt_warning',
    'trade_auto_cancelled',
    'signed_spa_required',
    // NEGOTIATION COUNTER LIMIT: Counter tracking notifications
    'last_counter_warning',
    'final_offer_notification',
    // Welcome & onboarding notifications
    'welcome_email',
    'onboarding_completed',
    // Wishlist & product alerts
    'product_back_in_stock',
    'wishlist_price_dropped',
    'contact_saved',
    'company_favourited',
    // Stalled trade reminder
    'stalled_trade_reminder',
  ])
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  tradeId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
