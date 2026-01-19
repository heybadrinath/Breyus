import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationType =
    | 'trade_created'
    | 'counter_offer'
    | 'trade_accepted'
    | 'trade_rejected'
    | 'document_uploaded'
    | 'documents_invalidated'
    | 'phase_advanced'
    | 'trade_completed'
    | 'trade_cancelled'
    | 'new_message'
    | 'analysis_completed'
    // Admin actions
    | 'account_suspended'
    | 'account_unsuspended'
    | 'password_reset_required'
    // KYC notifications
    | 'kyc_document_approved'
    | 'kyc_document_rejected'
    | 'company_kyc_verified'
    // Dispute notifications
    | 'dispute_created'
    | 'dispute_resolved'
    | 'dispute_message';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({
        type: String,
        required: true,
        enum: [
            'trade_created', 'counter_offer', 'trade_accepted', 'trade_rejected',
            'document_uploaded', 'documents_invalidated', 'phase_advanced',
            'trade_completed', 'trade_cancelled', 'new_message', 'analysis_completed',
            'account_suspended', 'account_unsuspended', 'password_reset_required',
            'kyc_document_approved', 'kyc_document_rejected', 'company_kyc_verified',
            'dispute_created', 'dispute_resolved', 'dispute_message'
        ]
    })
    type: NotificationType;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false, index: true })
    read: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Trade' })
    tradeId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Conversation' })
    conversationId?: Types.ObjectId;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
    priority: NotificationPriority;

    @Prop()
    actionUrl?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 }); // Get unread/read for user
NotificationSchema.index({ userId: 1, createdAt: -1 });          // Get all for user
NotificationSchema.index({ read: 1, createdAt: 1 });             // For cleanup jobs
NotificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } },
); // Auto-expire read notifications after 30 days
