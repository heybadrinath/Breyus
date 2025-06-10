import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PurchaseRequestDto {
  // Step 1: Trade Queries 1
  @IsNotEmpty({ message: 'Company revenue range is required' })
  @IsNumber({}, { message: 'Revenue range must be a number' })
  @Min(0, { message: 'Revenue range must be greater than 0' })
  companyRevenueRange: number;

  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  @IsEnum(['USD', 'INR'], { message: 'Currency must be USD or INR' })
  currency: string;

  @IsNotEmpty({ message: 'Revenue unit is required' })
  @IsString({ message: 'Revenue unit must be a string' })
  @IsEnum(['Crore', 'Million'], { message: 'Revenue unit must be Crore or Million' })
  revenueUnit: string;

  @IsNotEmpty({ message: 'Trade duration is required' })
  @IsNumber({}, { message: 'Trade duration must be a number' })
  @Min(1, { message: 'Trade duration must be at least 1 year' })
  tradeDurationYears: number;

  @IsNotEmpty({ message: 'Product usage description is required' })
  @IsString({ message: 'Product usage description must be a string' })
  productUsage: string;

  // Step 2: Trade Queries 2
  @IsNotEmpty({ message: 'Industry information is required' })
  @IsString({ message: 'Industry must be a string' })
  industry: string;

  @IsNotEmpty({ message: 'Market experience is required' })
  @IsNumber({}, { message: 'Market experience must be a number' })
  @Min(0, { message: 'Market experience cannot be negative' })
  marketExperienceYears: number;

  @IsNotEmpty({ message: 'Market capture percentage is required' })
  @IsNumber({}, { message: 'Market capture must be a number' })
  @Min(0, { message: 'Market capture cannot be negative' })
  @Max(100, { message: 'Market capture cannot exceed 100%' })
  marketCapturePercentage: number;

  // Step 3: Pricing (Inco-Terms)
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsOptional()
  @IsBoolean({ message: 'On sale must be a boolean' })
  onSale?: boolean;

  @IsNotEmpty({ message: 'Price currency is required' })
  @IsString({ message: 'Price currency must be a string' })
  @IsEnum(['USD', 'INR', 'EUR'], { message: 'Price currency must be USD, INR, or EUR' })
  priceCurrency: string;

  @IsOptional()
  @IsString({ message: 'SKU must be a string' })
  sku?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  discount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Sale price must be a number' })
  @Min(0, { message: 'Sale price cannot be negative' })
  salePrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Cost of goods must be a number' })
  @Min(0, { message: 'Cost of goods cannot be negative' })
  costOfGoods?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Profit must be a number' })
  profit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Margin must be a number' })
  @Min(0, { message: 'Margin cannot be negative' })
  @Max(100, { message: 'Margin cannot exceed 100%' })
  margin?: number;

  // Step 4: Payment Mode
  @IsNotEmpty({ message: 'Payment mode is required' })
  @IsString({ message: 'Payment mode must be a string' })
  @IsEnum(['advance', 'credit', 'open'], { message: 'Payment mode must be advance, credit, or open' })
  paymentMode: string;

  @IsOptional()
  @IsNumber({}, { message: 'Advance percentage must be a number' })
  @Min(0, { message: 'Advance percentage cannot be negative' })
  @Max(100, { message: 'Advance percentage cannot exceed 100%' })
  advancePercentage?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Credit timeline must be a number' })
  @Min(1, { message: 'Credit timeline must be at least 1 day' })
  creditTimelineDays?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Payment timeline must be a number' })
  @Min(1, { message: 'Payment timeline must be at least 1 day' })
  paymentTimelineDays?: number;
}

export class ValidatePurchaseRequestStepDto {
  @IsNotEmpty({ message: 'Step number is required' })
  @IsNumber({}, { message: 'Step must be a number' })
  @Min(1, { message: 'Step must be at least 1' })
  @Max(4, { message: 'Step cannot exceed 4' })
  step: number;

  @IsOptional()
  data?: any;
}
