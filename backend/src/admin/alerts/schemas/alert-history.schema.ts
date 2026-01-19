import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AlertEventType } from './alert-rule.schema';

export enum AlertEmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'alerthistory' })
export class AlertHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AlertRule', required: true })
  ruleId: Types.ObjectId;

  @Prop({ required: true })
  ruleName: string;

  @Prop({ required: true, enum: AlertEventType })
  eventType: AlertEventType;

  @Prop({ required: true })
  triggeredAt: Date;

  @Prop({ type: Object })
  payload: Record<string, any>; // Event details

  @Prop({ type: [String] })
  recipientsSent: string[];

  @Prop({ required: true, enum: AlertEmailStatus })
  emailStatus: AlertEmailStatus;

  @Prop()
  errorMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AlertHistorySchema = SchemaFactory.createForClass(AlertHistory);

// Create indexes
AlertHistorySchema.index({ ruleId: 1 });
AlertHistorySchema.index({ eventType: 1 });
AlertHistorySchema.index({ triggeredAt: -1 });
AlertHistorySchema.index({ emailStatus: 1 });
