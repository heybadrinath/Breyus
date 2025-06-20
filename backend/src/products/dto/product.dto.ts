import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  moq?: string;

  @IsOptional()
  @IsString()
  preciseDescription?: string;

  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  productImage?: string;

  @IsOptional()
  @IsString()
  testReports?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costOfGoods?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  margin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // trade terms 
  @IsOptional()
  @IsString()
  preferred_buyer_revenue_range?: string;

  @IsOptional()
  @IsString()
  potential_years_to_trade?: string;

  @IsOptional()
  @IsString()
  industry_using_product?: string;

  @IsOptional()
  @IsString()
  years_in_market?: string;

  @IsOptional()
  @IsString()
  buyer_market_duration?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  market_capture?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  moq?: string;

  @IsOptional()
  @IsString()
  preciseDescription?: string;

  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  productImage?: string;

  @IsOptional()
  @IsString()
  testReports?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costOfGoods?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  margin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // trade terms
  @IsOptional()
  @IsString()
  preferred_buyer_revenue_range?: string;

  @IsOptional()
  @IsString()
  potential_years_to_trade?: string;

  @IsOptional()
  @IsString()
  industry_using_product?: string;

  @IsOptional()
  @IsString()
  years_in_market?: string;

  @IsOptional()
  @IsString()
  buyer_market_duration?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  market_capture?: number;
}