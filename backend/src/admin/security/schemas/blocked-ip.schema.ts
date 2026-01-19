import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'blockedips' })
export class BlockedIP extends Document {
  @Prop({ required: true, unique: true })
  ipAddress: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  blockedBy: Types.ObjectId;

  @Prop({ required: true })
  blockedAt: Date;

  @Prop()
  expiresAt?: Date; // null = permanent block

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const BlockedIPSchema = SchemaFactory.createForClass(BlockedIP);

// Create indexes
BlockedIPSchema.index({ ipAddress: 1 });
BlockedIPSchema.index({ isActive: 1 });
BlockedIPSchema.index({ expiresAt: 1 });
