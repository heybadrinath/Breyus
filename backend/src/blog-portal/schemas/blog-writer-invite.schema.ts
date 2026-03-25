import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BlogWriterInvite Schema
 *
 * Invite-based writer system:
 * - Admin generates invite with unique token
 * - Token valid for 7 days
 * - Single-use (marked as used once redeemed)
 * - Any user (Breyus or blog-only) can redeem
 */
@Schema({ timestamps: true, collection: 'blog_writer_invites' })
export class BlogWriterInvite extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;

  @Prop({ required: true, unique: true })
  token: string; // Unique, random hex

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  createdBy: Types.ObjectId; // Ref to AdminUser

  @Prop({ type: Types.ObjectId, ref: 'BlogUser', default: null })
  usedBy: Types.ObjectId | null; // Ref to blog_users

  @Prop({ type: Date, default: null })
  usedAt: Date | null;

  @Prop({ type: Date, required: true })
  expiresAt: Date; // +7 days from creation

  // Optional: email hint for targeted invites
  @Prop({ type: String, default: null, lowercase: true, trim: true })
  emailHint: string | null;

  // Optional: note from admin about this invite
  @Prop({ type: String, default: null, maxlength: 500 })
  adminNote: string | null;
}

export const BlogWriterInviteSchema =
  SchemaFactory.createForClass(BlogWriterInvite);

// Indexes
BlogWriterInviteSchema.index({ token: 1 }, { unique: true });
BlogWriterInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for cleanup of expired unused invites
BlogWriterInviteSchema.index({ createdBy: 1 });
BlogWriterInviteSchema.index({ usedBy: 1 }, { sparse: true });
