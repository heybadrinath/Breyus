import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductCategory extends Document {
  declare _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string; // URL-friendly: "agricultural-products"

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'ProductCategory', default: null })
  parent?: Types.ObjectId | null; // null = root category

  @Prop({ default: 0 })
  level: number; // 0 = root, 1 = sub, 2 = sub-sub (max 3 levels)

  @Prop({ default: 0 })
  order: number; // For drag-drop reordering

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean; // Soft delete

  @Prop({ type: Date })
  deletedAt?: Date;

  // ===== Mainstream/Niche Classification Fields =====

  /**
   * Mainstream/Niche classification for leaf categories only.
   * - null: Parent category (not a tradable commodity)
   * - true: Mainstream commodity (traded on exchanges, high volume)
   * - false: Niche commodity (specialized, lower volume)
   */
  @Prop({ type: Boolean, default: null })
  isMainstream?: boolean | null;

  /**
   * Alternative names for this commodity (e.g., ["Maize"] for "Corn")
   * Useful for search matching
   */
  @Prop({ type: [String], default: [] })
  aliases: string[];

  /**
   * 4-digit HS code prefix (e.g., "1001" for Wheat)
   * Links to HSN codes for trade classification
   */
  @Prop()
  hsCodePrefix?: string;

  /**
   * User ID who suggested this category (for user-submitted pending categories)
   * If set, indicates this was submitted by a seller and may need admin approval
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdByUser?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);

// Add indexes for common queries
ProductCategorySchema.index({ slug: 1 });
ProductCategorySchema.index({ parent: 1 });
ProductCategorySchema.index({ level: 1 });
ProductCategorySchema.index({ order: 1 });
ProductCategorySchema.index({ isActive: 1, isDeleted: 1 });
ProductCategorySchema.index({ name: 'text', aliases: 'text' }); // Text search including aliases

// Mainstream/Niche classification indexes
ProductCategorySchema.index({ isMainstream: 1, isActive: 1, isDeleted: 1 }); // For grouped queries
ProductCategorySchema.index({ hsCodePrefix: 1 }); // For HS code lookups
ProductCategorySchema.index({ createdByUser: 1 }); // For pending user submissions
