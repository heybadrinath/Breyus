import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define all possible Incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
  selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm
  defaults?: Record<IncotermType, IncotermRowData>;  // Default Incoterm values
}

// Product Schema definition
@Schema()
export class Product extends Document {
  @Prop({ required: true })
  name: string;  // Product name

  @Prop({ required: true })
  moq: string;  // Minimum Order Quantity (MOQ)

  @Prop({ required: true })
  moqUnit: string;  // MOQ Unit

  @Prop({ required: true })
  description: string;  // Product description

  @Prop({ required: true })
  detailedDescription: string;  // Detailed Product Description

  @Prop({ required: true })
  category: string;  // Category of the product

  @Prop({ required: true })
  hsnCode: string;  // Harmonized System Nomenclature Code

  @Prop({ required: true })
  price: string;  // Price of the product

  @Prop({ required: true })
  currency: string;  // Currency (e.g., USD, INR)

  @Prop({ required: true })
  sku: string;  // Stock Keeping Unit (SKU)

  @Prop({ default: false })
  onSale: boolean;  // If product is on sale

  @Prop()
  discount?: string;  // Discount applied to the product

  @Prop()
  salePrice?: string;  // Sale price of the product

  @Prop()
  costOfGoods?: string;  // Cost of goods sold

  @Prop()
  profit?: string;  // Profit margin

  @Prop()
  pricing?: string;  // Pricing strategy

  @Prop()
  margin?: string;  // Margin percentage

  @Prop({ type: [String], required: true })
  tags: string[];  // Tags for the product

  // Trade terms properties
  @Prop()
  revenueMin?: string;  // Minimum revenue

  @Prop()
  revenueMax?: string;  // Maximum revenue

  @Prop()
  currencyTrade?: string;  // Currency used in trade terms

  @Prop()
  unitTrade?: string;  // Unit used for revenue (e.g., Crore)

  @Prop()
  yearsTrade?: string;  // Number of years in trade

  @Prop()
  industry?: string;  // Industry to which the product belongs

  @Prop()
  marketYears?: string;  // Number of years in the market

  @Prop()
  sellerMarketYears?: string;  // Number of years the seller has been in the market

  @Prop()
  marketcapture?: string;  // Market capture percentage

  // Incoterms properties
   @Prop()
  selectedIncoterm?: IncotermType;  // Type-safe, now it will only accept 'EXW', 'FOB', etc.

  @Prop({ type: Map, of: String })
  selectedIncotermData?: IncotermRowData;  // e.g., 'Insurance': 'Buyer'

  @Prop({ type: Map, of: Map })
  defaults?: Record<IncotermType, IncotermRowData>;  // Default values for each Incoterm type

  // File upload fields
  @Prop({ type: [String], default: [] })
  productImages: string[];  // Array of uploaded image file paths

  @Prop({ type: [String], default: [] })
  testReports: string[];  // Array of uploaded test report file paths

  // User association
  @Prop({ required: true })
  userId: string;  // ID of the user who created the product

  // Timestamps
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}


export const ProductSchema = SchemaFactory.createForClass(Product);
