import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Block content types for Notion-style editor
 * Each block has a type and content, allowing flexible article composition
 */
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'image'
  | 'quote'
  | 'divider'
  | 'code';

/**
 * Individual content block structure
 * Supports rich text editing with various block types
 */
export interface BlockContent {
  id: string;           // Unique block identifier for drag-drop
  type: BlockType;
  content: string;      // Text content or image URL
  meta?: {
    alt?: string;       // Image alt text
    caption?: string;   // Image caption
    language?: string;  // Code language (for code blocks)
    items?: string[];   // List items (for bullet/numbered lists)
  };
}

/**
 * Blog post status for simple workflow
 * Draft → Published flow (no complex approval workflows)
 */
export type BlogStatus = 'draft' | 'published';

@Schema({ timestamps: true })
export class BlogPost extends Document {
  @Prop({ required: true, type: String, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, type: String, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: [Object], default: [] })
  content: BlockContent[];

  @Prop({ type: String, maxlength: 500 })
  excerpt: string;

  @Prop({ type: String })
  featuredImage?: string;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  author: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  })
  status: BlogStatus;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  hsnCodePrefixes: string[];

  @Prop({ type: Number, default: 1, min: 1 })
  readTimeMinutes: number;

  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  // Timestamps added by { timestamps: true }
  createdAt: Date;
  updatedAt: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);

// Indexes for efficient queries
BlogPostSchema.index({ slug: 1 }, { unique: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ categories: 1, status: 1 });
BlogPostSchema.index({ tags: 1, status: 1 });
BlogPostSchema.index({ hsnCodePrefixes: 1, status: 1 });
BlogPostSchema.index({ author: 1, status: 1 });
BlogPostSchema.index({ isDeleted: 1 });

// Text index for search functionality
BlogPostSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
