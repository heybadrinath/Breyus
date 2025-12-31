import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, IsBoolean, IsNumberString, IsObject } from 'class-validator';

// Define all possible Incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
  selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm
  defaults?: Record<IncotermType, IncotermRowData>;  // Default Incoterm values
}

// Data Transfer Object for CreateProduct
export class CreateProductDto {

  // product information
  @IsNotEmpty()
  @IsString()
  name: string;  // Product name

  @IsNotEmpty()
  @IsNumberString()
  stock: string;  // stock available

  @IsNotEmpty()
  @IsString()
  stockUnit: string;  // Stock Unit

  @IsNotEmpty()
  @IsNumberString()
  moq: string;  // Minimum Order Quantity (MOQ)

  @IsNotEmpty()
  @IsString()
  moqUnit: string;  // MOQ Unit

  @IsNotEmpty()
  @IsString()
  description: string;  // Product description

  @IsNotEmpty()
  @IsString()
  detailedDescription: string;  // Detailed Product Description

  @IsNotEmpty()
  @IsString()
  category: string;  // Category of the product

  @IsNotEmpty()
  @IsString()
  hsnCode: string;  // Harmonized System Nomenclature Code

  
  // pricing
  @IsNotEmpty()
  @IsString()
  price: string;  // Price of the product

  @IsNotEmpty()
  @IsString()
  currency: string;  // Currency (e.g., USD, INR)

  @IsNotEmpty()
  @IsString()
  sku: string;  // Stock Keeping Unit (SKU)

  @IsOptional()
  @IsBoolean()
  onSale: boolean;  // If product is on sale

  @IsOptional()
  @IsString()
  discount?: string;  // Discount applied to the product

  @IsOptional()
  @IsString()
  salePrice?: string;  // Sale price of the product

  @IsOptional()
  @IsString()
  costOfGoods?: string;  // Cost of goods sold

  @IsOptional()
  @IsString()
  profit?: string;  // Profit margin

  @IsOptional()
  @IsString()
  margin?: string;  // Margin percentage



  // Tags
  @IsArray()
  @ArrayNotEmpty()
  tags: string[];  // Tags for the product



  // Trade terms properties
  @IsOptional()
  @IsString()
  revenueMin?: string;  // Minimum revenue

  @IsOptional()
  @IsString()
  revenueMax?: string;  // Maximum revenue

  @IsOptional()
  @IsString()
  currencyTrade?: string;  // Currency used in trade terms

  @IsOptional()
  @IsString()
  unitTrade?: string;  // Unit used for revenue (e.g., Crore)

  @IsOptional()
  @IsString()
  yearsTrade?: string;  // Number of years in trade

  @IsOptional()
  @IsString()
  industry?: string;  // Industry to which the product belongs

  @IsOptional()
  @IsString()
  sellermarketYears?: string;  // Number of years in the market seller

  @IsOptional()
  @IsString()
  sellerMarketYears?: string;  // Number of years the buyer need to be in the market

  @IsOptional()
  @IsString()
  marketcapture?: string;  // Market capture percentage




  @IsOptional()  // Make this field optional
  @IsString()  // Validate that it's a string
  selectedIncoterm?: IncotermType;  // e.g., 'EXW', 'FOB', 'CIF', etc.

  @IsOptional()  // Make this field optional
  @IsObject()  // Validate that it's an object (key-value pairs like { 'Insurance': 'Buyer' })
  selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm (e.g., { 'Insurance': 'Buyer' })

  // File upload fields
  @IsOptional()
  @IsArray()
  productImages?: string[];  // Array of uploaded image file paths

  @IsOptional()
  @IsArray()
  testReports?: string[];  // Array of uploaded test report file paths

  // User association
  @IsOptional()
  @IsString()
  userId?: string;  // ID of the user who created the product
}
