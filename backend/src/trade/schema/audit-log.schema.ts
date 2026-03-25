import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// All possible audit actions
export type AuditAction =
  | 'trade_created'
  | 'counter_offer'
  | 'buyer_response'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'document_uploaded'
  | 'document_replaced'
  | 'document_verified'
  | 'document_rejected'
  | 'phase_advanced'
  | 'trade_completed'
  | 'signature_added';

// Audit Log Schema definition
@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Trade', required: true, index: true })
  trade: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'trade_created',
      'counter_offer',
      'buyer_response',
      'accepted',
      'rejected',
      'cancelled',
      'document_uploaded',
      'document_replaced',
      'document_verified',
      'document_rejected',
      'phase_advanced',
      'trade_completed',
      'signature_added',
    ],
  })
  action: AuditAction;

  @Prop({ type: Object })
  previousState?: Record<string, any>;

  @Prop({ type: Object })
  newState?: Record<string, any>;

  @Prop()
  details?: string;

  @Prop()
  documentType?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Add compound index for efficient queries
AuditLogSchema.index({ trade: 1, createdAt: -1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
