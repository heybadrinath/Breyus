import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Price Range DTO
 */
export class PriceRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  unit?: string; // per_tonne, per_kg, etc.
}

/**
 * Main AI Search Input DTO
 * Used for both buyer and seller searches
 */
export class AISearchInputDto {
  @IsString()
  commodity: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  port?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Commodity Search DTO (for selection page)
 */
export class CommoditySearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Market Analysis DTO
 */
export class MarketAnalysisDto {
  @IsString()
  commodity: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  sourceCountry?: string;
}

/**
 * Gravity Score DTO
 */
export class GravityScoreDto {
  @IsString()
  commodity: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsString()
  buyerCountry?: string;

  @IsOptional()
  @IsString()
  sellerCountry?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;
}

/**
 * Niche Commodity Search DTO
 */
export class NicheSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Search Buyers for Product DTO
 * Used when seller wants to find buyers for their specific product
 */
export class SearchFromProductDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
