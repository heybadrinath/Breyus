import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

@Schema({ timestamps: true, collection: 'adminsessions' })
export class AdminSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ type: Object })
  deviceInfo: DeviceInfo;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminSessionSchema = SchemaFactory.createForClass(AdminSession);

// Create indexes
AdminSessionSchema.index({ tokenHash: 1 }, { unique: true });
AdminSessionSchema.index({ adminId: 1 });
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
