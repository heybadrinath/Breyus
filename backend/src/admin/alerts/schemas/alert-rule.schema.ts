import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AlertEventType {
  USER_SUSPENDED = 'USER_SUSPENDED',
  KYC_PENDING_THRESHOLD = 'KYC_PENDING_THRESHOLD',
  TRADE_STALLED = 'TRADE_STALLED',
  FAILED_LOGIN_SPIKE = 'FAILED_LOGIN_SPIKE',
  NEW_DISPUTE = 'NEW_DISPUTE',
}

@Schema({ timestamps: true, collection: 'alertrules' })
export class AlertRule extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: AlertEventType })
  eventType: AlertEventType;

  @Prop({ default: true })
  isEnabled: boolean;

  @Prop()
  threshold?: number; // e.g., KYC pending > 50

  @Prop()
  timeWindowMinutes?: number; // e.g., failed logins in last 60 minutes

  @Prop({ type: [String], required: true })
  recipients: string[]; // Email addresses

  @Prop({ default: 60 })
  cooldownMinutes: number; // Prevent spam (default: 60 minutes)

  @Prop()
  lastTriggeredAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);

// Create indexes
AlertRuleSchema.index({ eventType: 1 });
AlertRuleSchema.index({ isEnabled: 1 });
