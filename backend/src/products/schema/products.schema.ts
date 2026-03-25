import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define all possible Incoterms
type IncotermType =
  | 'EXW'
  | 'FCA'
  | 'FAS'
  | 'FOB'
  | 'CFR'
  | 'CIF'
  | 'CPT'
  | 'CIP'
  | 'DAP'
  | 'DPU'
  | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
  selectedIncotermData?: IncotermRowData; // Data for selected Incoterm
  defaults?: Record<IncotermType, IncotermRowData>; // Default Incoterm values
}

// Product Schema definition
@Schema()
export class Product extends Document {
  @Prop({ required: true })
  name: string; // Product name

  // FIXED: Changed from string to number for proper numeric operations (Audit Bug #1)
  @Prop({ required: true, type: Number, min: 0 })
  stock: number; // Current stock quantity

  @Prop({ required: true })
  stockUnit: string; // Stock Unit

  @Prop({ required: true })
  moq: string; // Minimum Order Quantity (MOQ)

  @Prop({ required: true })
  moqUnit: string; // MOQ Unit

  @Prop({ required: true })
  description: string; // Product description

  @Prop({ required: true })
  detailedDescription: string; // Detailed Product Description

  @Prop()
  application?: string; // Practical application value

  @Prop()
  environmentalImpact?: string; // Environmental impact

  @Prop()
  qualityAssurance?: string; // Quality assurance notes

  @Prop({ required: true })
  category: string; // Category of the product

  @Prop({ required: true })
  hsnCode: string; // Harmonized System Nomenclature Code

  // FIXED: Changed from string to number for proper numeric operations (Audit Bug #1)
  @Prop({ required: true, type: Number, min: 0 })
  price: number; // Price per unit

  @Prop({ required: true })
  currency: string; // Currency (e.g., USD, INR)

  @Prop({ required: true })
  sku: string; // Stock Keeping Unit (SKU)

  @Prop({ default: true })
  isActive?: boolean; // Whether the product is visible to buyers

  @Prop({ default: false })
  onSale: boolean; // If product is on sale

  // FIXED: Changed from string to number (Audit Bug #1)
  @Prop({ type: Number, min: 0, max: 100 })
  discount?: number; // Discount percentage (0-100)

  @Prop({ type: Number, min: 0 })
  salePrice?: number; // Discounted sale price

  @Prop({ type: Number, min: 0 })
  costOfGoods?: number; // Cost of goods sold

  @Prop({ type: Number })
  profit?: number; // Profit margin per unit

  @Prop()
  pricing?: string; // Pricing strategy

  @Prop()
  margin?: string; // Margin percentage

  @Prop({ type: [String], required: true })
  tags: string[]; // Tags for the product

  // Trade terms properties
  @Prop()
  exportLocation?: string; // Export location for the product

  @Prop()
  nearestPort?: string; // Nearest exporting port

  @Prop()
  revenueMin?: string; // Minimum revenue

  @Prop()
  revenueMax?: string; // Maximum revenue

  @Prop()
  currencyTrade?: string; // Currency used in trade terms

  @Prop()
  unitTrade?: string; // Unit used for revenue (e.g., Crore)

  @Prop()
  paymentTerms?: string; // Payment, bank, and insurance terms

  @Prop()
  logisticsTerms?: string; // Delivery/logistics terms

  @Prop()
  popTerms?: string; // Proof of product terms

  @Prop()
  yearsTrade?: string; // Number of years in trade

  @Prop()
  industry?: string; // Industry to which the product belongs

  @Prop()
  marketYears?: string; // Number of years in the market

  @Prop()
  sellerMarketYears?: string; // Number of years the seller has been in the market

  @Prop()
  marketcapture?: string; // Market capture percentage

  // Incoterms properties
  @Prop()
  selectedIncoterm?: IncotermType; // Type-safe, now it will only accept 'EXW', 'FOB', etc.

  @Prop({ type: Map, of: String })
  selectedIncotermData?: IncotermRowData; // e.g., 'Insurance': 'Buyer'

  @Prop({ type: Map, of: Map })
  defaults?: Record<IncotermType, IncotermRowData>; // Default values for each Incoterm type

  // File upload fields
  @Prop({ type: [String], default: [] })
  productImages: string[]; // Array of uploaded image file paths

  @Prop({ type: [String], default: [] })
  testReports: string[]; // Array of uploaded test report file paths

  // User association
  @Prop({ required: true })
  userId: string; // ID of the user who created the product

  // Commodity classification (for AI matching)
  @Prop()
  commodityId?: string; // Legacy: Reference to commodities collection (deprecated)

  @Prop({ type: String })
  categoryId?: string; // Reference to ProductCategory collection for classification

  @Prop({ default: false })
  isNicheCommodity: boolean; // Auto-set based on category.isMainstream (false = mainstream, true = niche)

  // Admin moderation fields
  @Prop({ default: false })
  isDeactivated: boolean; // Admin override - if true, product is hidden regardless of isActive

  @Prop()
  deactivatedAt?: Date; // When the product was deactivated by admin

  @Prop()
  deactivatedBy?: string; // Admin user ID who deactivated

  @Prop()
  deactivationReason?: string; // Reason for admin deactivation

  // Owner deletion tracking (Bug #6: Cascade Deletes)
  @Prop({ default: false })
  ownerDeleted: boolean; // True if product owner's account was deleted

  @Prop()
  ownerDeletedAt?: Date; // When the owner's account was deleted

  @Prop({ default: false })
  isFeatured: boolean; // Whether product is featured by admin

  @Prop()
  featuredAt?: Date; // When the product was featured

  @Prop()
  featuredBy?: string; // Admin user ID who featured the product

  // ============================================================================
  // VIEW TRACKING (for real analytics - replaces fake visits calculation)
  // ============================================================================

  @Prop({ type: Number, default: 0 })
  viewCount: number; // Total lifetime views of this product

  @Prop({ type: Date })
  lastViewedAt?: Date; // When the product was last viewed

  @Prop({
    type: [
      {
        date: { type: Date },
        count: { type: Number },
      },
    ],
    default: [],
  })
  dailyViews: { date: Date; count: number }[]; // Rolling 90-day view history

  // Timestamps
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Performance indexes for common queries (Audit Bug #2 - Missing indexes)
ProductSchema.index({ userId: 1, isActive: 1 }); // Seller's active products
ProductSchema.index({ category: 1, isActive: 1 }); // Category browsing
ProductSchema.index({ hsnCode: 1 }); // HSN code lookup
ProductSchema.index({ isActive: 1, isDeactivated: 1, ownerDeleted: 1 }); // Public product filtering
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Full-text search
ProductSchema.index({ categoryId: 1, isNicheCommodity: 1 }); // Category classification filtering
ProductSchema.index({ userId: 1, 'dailyViews.date': 1 }); // View tracking analytics queries
