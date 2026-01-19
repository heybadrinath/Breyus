import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Feedback type - seller, delivery, or product feedback
export type FeedbackType = 'seller' | 'delivery' | 'product';

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Trade', required: true })
  trade: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewer: Types.ObjectId; // The user who submitted the feedback

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewee: Types.ObjectId; // The user being reviewed (seller for seller feedback)

  @Prop({
    type: String,
    enum: ['seller', 'delivery', 'product'],
    required: true,
  })
  feedbackType: FeedbackType;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, default: '' })
  comment: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Map, of: String, default: {} })
  details?: Record<string, string>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

FeedbackSchema.set('toJSON', { flattenMaps: true });
FeedbackSchema.set('toObject', { flattenMaps: true });

// Create indexes for efficient queries
FeedbackSchema.index({ trade: 1 });
FeedbackSchema.index({ product: 1 });
FeedbackSchema.index({ reviewee: 1 });
FeedbackSchema.index({ reviewer: 1 });
FeedbackSchema.index({ feedbackType: 1 });
