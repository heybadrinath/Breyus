import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MaintenanceConfig extends Document {
  @Prop({ default: false })
  isEnabled: boolean;

  @Prop({ default: 'System maintenance in progress. Please try again later.' })
  message: string;

  @Prop()
  estimatedEndTime?: Date;

  @Prop()
  scheduledStart?: Date;

  @Prop()
  scheduledEnd?: Date;

  @Prop({ type: [String], default: [] })
  allowedIPs: string[];

  @Prop()
  lastEnabledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  lastEnabledBy?: Types.ObjectId;

  @Prop()
  lastDisabledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  lastDisabledBy?: Types.ObjectId;
}

export const MaintenanceConfigSchema = SchemaFactory.createForClass(MaintenanceConfig);
