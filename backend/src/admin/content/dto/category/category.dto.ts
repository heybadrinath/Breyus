import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string; // Auto-generated if not provided

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  // ===== Mainstream/Niche Classification Fields =====

  @IsOptional()
  @IsBoolean()
  isMainstream?: boolean | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  hsCodePrefix?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ===== Mainstream/Niche Classification Fields =====

  @IsOptional()
  @IsBoolean()
  isMainstream?: boolean | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  hsCodePrefix?: string;
}

export class GetCategoriesQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  rootOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  // ===== Mainstream/Niche Filter =====

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isMainstream?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  leafOnly?: boolean; // Only categories with isMainstream !== null (actual commodities)

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  pendingOnly?: boolean; // Categories submitted by users (createdByUser is set)
}

export class ReorderCategoryDto {
  @IsMongoId()
  categoryId: string;

  @IsNumber()
  @Min(0)
  newOrder: number;

  @IsOptional()
  @IsMongoId()
  newParent?: string | null;
}

/**
 * DTO for sellers to suggest new categories (pending admin approval)
 */
export class SuggestCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

/**
 * DTO for admin to toggle mainstream/niche classification
 */
export class ToggleMainstreamDto {
  @IsBoolean()
  isMainstream: boolean;
}

/**
 * DTO for admin to reject a user-submitted category
 * Requires reassignment to an existing approved category
 */
export class RejectCategoryDto {
  @IsMongoId()
  replacementCategoryId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

/**
 * DTO for admin to approve a user-submitted category with optional edits
 * Allows admin to change name, parent, and classification during approval
 */
export class ApproveCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string; // New name (if admin wants to rename)

  @IsOptional()
  @IsMongoId()
  parentId?: string | null; // Move to different parent category

  @IsOptional()
  @IsBoolean()
  isMainstream?: boolean; // Classification: true = mainstream, false = niche (default)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[]; // Alternative names for this commodity

  @IsOptional()
  @IsString()
  @MaxLength(10)
  hsCodePrefix?: string; // 4-digit HS code prefix
}
