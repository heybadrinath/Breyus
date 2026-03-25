// wishlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Wishlist Schema
 * Supports three types of wishlist items:
 * 1. Products (existing functionality)
 * 2. Saved contacts from AI results (off-platform companies)
 * 3. Favourite companies (platform companies favourited by buyers)
 */
@Schema()
export class Wishlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // For product wishlist items
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product?: Types.ObjectId;

  // For favourite company items (platform companies)
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company?: Types.ObjectId;

  // Type of wishlist item
  @Prop({
    type: String,
    enum: ['product', 'ai_contact', 'company'],
    default: 'product',
  })
  sourceType: 'product' | 'ai_contact' | 'company';

  // ═══════════════════════════════════════════════════════════════
  // SAVED CONTACT FIELDS (for AI-sourced off-platform companies)
  // ═══════════════════════════════════════════════════════════════

  @Prop()
  savedContactName?: string; // Company name from AI

  @Prop()
  savedContactEmail?: string; // Email from AI

  @Prop()
  savedContactPhone?: string; // Phone from AI

  @Prop()
  savedContactCountry?: string; // Country from AI

  @Prop()
  savedContactAddress?: string; // Address from AI

  @Prop()
  savedCommodity?: string; // Commodity they trade (for reference)

  @Prop()
  savedHsCode?: string; // HS code (for reference)

  @Prop()
  savedMatchScore?: number; // AI match score at time of save

  @Prop()
  savedContactRole?: string; // 'buyer' or 'seller'

  @Prop()
  notes?: string; // User's notes about this contact

  @Prop({ default: Date.now })
  dateAdded: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Unique index for product wishlists (user + product)
WishlistSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { product: { $exists: true } } },
);

// Unique index for contact wishlists (user + contactEmail or contactName + contactCountry)
WishlistSchema.index(
  { user: 1, savedContactEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { savedContactEmail: { $exists: true } },
  },
);

// Unique index for company favourites (user + company)
WishlistSchema.index(
  { user: 1, company: 1 },
  { unique: true, partialFilterExpression: { company: { $exists: true } } },
);

// Compound index for querying by type
WishlistSchema.index({ user: 1, sourceType: 1 });
