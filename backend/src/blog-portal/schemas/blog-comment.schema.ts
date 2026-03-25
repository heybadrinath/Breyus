import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BlogComment Schema
 *
 * Comments on blog posts with:
 * - Auto-approval (comments appear immediately)
 * - Flag/report functionality
 * - Admin hide capability
 * - Soft delete support
 * - Nested replies via parentId
 */
@Schema({ timestamps: true, collection: 'blog_comments' })
export class BlogComment extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'BlogPost', required: true })
  blogPostId: Types.ObjectId; // Ref to blog_posts

  @Prop({ type: Types.ObjectId, ref: 'BlogUser', required: true })
  blogUserId: Types.ObjectId; // Ref to blog_users

  @Prop({ required: true, trim: true, maxlength: 2000 })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'BlogComment', default: null })
  parentId: Types.ObjectId | null; // For replies

  // Moderation
  @Prop({ type: Boolean, default: false })
  isFlagged: boolean;

  @Prop({ type: Number, default: 0 })
  flagCount: number;

  @Prop({ type: [String], default: [] })
  flagReasons: string[];

  @Prop({ type: Boolean, default: false })
  isHidden: boolean; // Admin can hide

  // Soft delete
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const BlogCommentSchema = SchemaFactory.createForClass(BlogComment);

// Indexes
BlogCommentSchema.index({ blogPostId: 1 });
BlogCommentSchema.index({ blogUserId: 1 });
BlogCommentSchema.index({ parentId: 1 });
BlogCommentSchema.index({ createdAt: -1 });
BlogCommentSchema.index({ isFlagged: 1, isHidden: 1 });
