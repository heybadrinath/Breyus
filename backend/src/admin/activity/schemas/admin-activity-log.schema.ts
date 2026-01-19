import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface ActivityMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;
  notes?: string;
  companyId?: string;
  [key: string]: any;
}

@Schema({ timestamps: true, collection: 'adminactivitylogs' })
export class AdminActivityLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  adminEmail: string;

  @Prop({ required: true })
  action: string; // e.g., 'auth.login', 'user.suspend', 'trade.force_phase'

  @Prop({ required: true })
  actionCategory: string; // e.g., 'auth', 'users', 'trades', 'system'

  @Prop()
  targetType: string; // e.g., 'user', 'trade', 'company'

  @Prop({ type: Types.ObjectId })
  targetId: Types.ObjectId;

  @Prop()
  targetIdentifier: string; // e.g., 'john@example.com', 'TRD-1234'

  @Prop({ required: true })
  description: string; // Human-readable description

  @Prop({ type: Object })
  previousValue: Record<string, any>;

  @Prop({ type: Object })
  newValue: Record<string, any>;

  @Prop({ type: Object })
  metadata: ActivityMetadata;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminActivityLogSchema = SchemaFactory.createForClass(AdminActivityLog);

// Create indexes for efficient querying
AdminActivityLogSchema.index({ adminId: 1 });
AdminActivityLogSchema.index({ timestamp: -1 });
AdminActivityLogSchema.index({ actionCategory: 1, timestamp: -1 });
AdminActivityLogSchema.index({ targetType: 1, targetId: 1 });
AdminActivityLogSchema.index({ action: 1 });
