import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Blog post access levels
 * - public: Anyone can read
 * - member_only: Only Breyus members can access
 */
export type BlogAccessLevel = 'public' | 'member_only';

/**
 * Blog post status with full editorial workflow
 *
 * Flow for admin posts: draft → published
 * Flow for writer posts: draft → submitted → in_review → approved → published
 *                                        ↘ revision_requested ↗
 *                                        ↘ rejected
 */
export type BlogStatus =
  | 'draft' // Initial state, being written
  | 'submitted' // Writer sent for review
  | 'in_review' // Admin is reviewing
  | 'revision_requested' // Needs changes from writer
  | 'approved' // Ready to publish
  | 'published' // Live on the blog
  | 'rejected'; // Not approved

/**
 * Content format type
 * Only Tiptap is supported going forward
 */
export type ContentFormat = 'tiptap';

@Schema({ timestamps: true, collection: 'blog_posts' })
export class BlogPost extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Core content fields
  @Prop({ required: true, type: String, trim: true, maxlength: 200 })
  title: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({ type: String, maxlength: 500 })
  excerpt: string;

  @Prop({ type: String })
  featuredImage?: string;

  // Tiptap content (replaces old block-based content)
  @Prop({
    type: String,
    enum: ['tiptap'],
    default: 'tiptap',
  })
  contentFormat: ContentFormat;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  tiptapContent: Record<string, any> | null; // Tiptap JSON document

  // Author attribution (admin or writer)
  @Prop({ type: Types.ObjectId, ref: 'AdminUser', default: null })
  author: Types.ObjectId | null; // Admin author (null if external writer)

  @Prop({ type: Types.ObjectId, ref: 'BlogUser', default: null })
  writerId: Types.ObjectId | null; // External writer (null if admin authored)

  @Prop({ type: String, default: '' })
  writerDisplayName: string;

  @Prop({ type: String, default: '' })
  writerBio: string;

  @Prop({ type: String, default: null })
  writerAvatar: string | null;

  // Status and workflow
  @Prop({
    type: String,
    enum: [
      'draft',
      'submitted',
      'in_review',
      'revision_requested',
      'approved',
      'published',
      'rejected',
    ],
    default: 'draft',
  })
  status: BlogStatus;

  @Prop({ type: Date })
  publishedAt?: Date;

  // Access control
  @Prop({
    type: String,
    enum: ['public', 'member_only'],
    default: 'public',
  })
  accessLevel: BlogAccessLevel;

  // Editorial workflow
  @Prop({ type: Date, default: null })
  submittedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ type: String, default: null, maxlength: 1000 })
  rejectionReason: string | null;

  @Prop({ type: String, default: null, maxlength: 1000 })
  revisionNotes: string | null;

  // Categorization
  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  hsnCodePrefixes: string[];

  // Engagement metrics
  @Prop({ type: Number, default: 0, min: 0 })
  likeCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  commentCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  shareCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  uniqueViewCount: number;

  // Reading metadata
  @Prop({ type: Number, default: 1, min: 1 })
  readTimeMinutes: number;

  // SEO fields
  @Prop({ type: String, maxlength: 70 })
  metaTitle?: string;

  @Prop({ type: String, maxlength: 160 })
  metaDescription?: string;

  // Featured/pinned status
  @Prop({ type: Boolean, default: false })
  isFeatured: boolean;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  // Soft delete
  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);

// Indexes for efficient queries
BlogPostSchema.index({ slug: 1 }, { unique: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ categories: 1, status: 1 });
BlogPostSchema.index({ tags: 1, status: 1 });
BlogPostSchema.index({ hsnCodePrefixes: 1, status: 1 });
BlogPostSchema.index({ author: 1, status: 1 });
BlogPostSchema.index({ writerId: 1, status: 1 });
BlogPostSchema.index({ accessLevel: 1, status: 1 });
BlogPostSchema.index({ isFeatured: 1, status: 1 });
BlogPostSchema.index({ isPinned: 1, status: 1 });
BlogPostSchema.index({ isDeleted: 1 });
BlogPostSchema.index({ viewCount: -1 }); // For trending queries

// Text index for search functionality
BlogPostSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
