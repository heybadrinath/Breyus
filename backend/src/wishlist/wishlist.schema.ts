// wishlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Wishlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ default: Date.now })
  dateAdded: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Add unique index to prevent duplicates of (user, product)
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });
