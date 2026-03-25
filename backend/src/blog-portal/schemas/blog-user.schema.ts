import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BlogUser Schema
 *
 * Separate user system for the blog portal with two user types:
 * 1. Breyus Members - Auto-created via SSO, synced password, full access
 * 2. Blog-only Readers - Standalone signup, limited to public content
 *
 * Writers are promoted from either user type via admin invite system.
 */
@Schema({ timestamps: true, collection: 'blog_users' })
export class BlogUser extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Core fields
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string; // bcrypt hashed (synced from Breyus for members)

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  companyName: string;

  @Prop({ trim: true })
  website?: string; // Optional

  @Prop({ trim: true })
  areaOfInterest: string;

  @Prop({ trim: true })
  experience: string;

  @Prop({ trim: true })
  areaOfExpertise: string;

  // Breyus integration
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  breyusUserId: Types.ObjectId | null; // Ref to main User collection

  @Prop({ type: Boolean, default: false })
  isBrèyusMember: boolean; // Verified Breyus user

  @Prop({ type: Boolean, default: false })
  passwordSyncedFromBreyus: boolean; // True if password was auto-copied from Breyus

  @Prop({ type: Date, default: null })
  passwordChangedAt: Date | null; // When user changed password (breaks sync)

  // Writer status
  @Prop({ type: Boolean, default: false })
  isWriter: boolean;

  @Prop({ type: String, default: null })
  writerInviteToken: string | null;

  @Prop({ type: Date, default: null })
  writerApprovedAt: Date | null;

  @Prop({ type: String, default: '', maxlength: 1000 })
  writerBio: string;

  @Prop({ type: String, default: null })
  writerAvatar: string | null;

  @Prop({ type: String, default: null })
  writerBanner: string | null;

  // Metadata
  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  // Suspension (admin-managed)
  @Prop({ type: Boolean, default: false })
  isSuspended: boolean;

  @Prop({ type: Date, default: null })
  suspendedAt: Date | null;

  @Prop({ type: String, default: null })
  suspendedBy: string | null; // Admin ID

  @Prop({ type: String, default: null })
  suspensionReason: string | null;

  // Soft delete
  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const BlogUserSchema = SchemaFactory.createForClass(BlogUser);

// Indexes
BlogUserSchema.index({ email: 1 }, { unique: true });
BlogUserSchema.index({ breyusUserId: 1 }, { sparse: true });
BlogUserSchema.index({ isWriter: 1 });
BlogUserSchema.index({ isBrèyusMember: 1 });
