import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BlogSession Schema
 *
 * Manages blog portal sessions separately from Breyus sessions.
 * Uses token hashing for security - original tokens are never stored.
 * TTL index auto-deletes expired sessions.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

@Schema({ timestamps: true, collection: 'blog_sessions' })
export class BlogSession extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'BlogUser', required: true })
  blogUserId: Types.ObjectId; // Ref to blog_users

  @Prop({ required: true, unique: true })
  tokenHash: string; // SHA256 of session token

  @Prop({ type: Object, default: {} })
  deviceInfo: DeviceInfo;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const BlogSessionSchema = SchemaFactory.createForClass(BlogSession);

// Indexes
BlogSessionSchema.index({ tokenHash: 1 }, { unique: true });
BlogSessionSchema.index({ blogUserId: 1 });
BlogSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
