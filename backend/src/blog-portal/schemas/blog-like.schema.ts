import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * BlogLike Schema
 *
 * Simple like system for blog posts.
 * Uses compound unique index to prevent duplicate likes.
 */
@Schema({ timestamps: true, collection: 'blog_likes' })
export class BlogLike extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'BlogPost', required: true })
  blogPostId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BlogUser', required: true })
  blogUserId: Types.ObjectId;
}

export const BlogLikeSchema = SchemaFactory.createForClass(BlogLike);

// Indexes
BlogLikeSchema.index({ blogPostId: 1, blogUserId: 1 }, { unique: true }); // Prevent duplicate likes
BlogLikeSchema.index({ blogPostId: 1 });
