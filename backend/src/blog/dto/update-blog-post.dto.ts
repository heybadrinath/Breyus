import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { BlogStatus, BlogAccessLevel } from '../schemas/blog-post.schema';
import { IsTiptapDocument } from '../validators/tiptap.validator';

/**
 * DTO for updating an existing blog post
 * All fields are optional for partial updates
 * Supports Tiptap JSON content format
 */
export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsTiptapDocument({ message: 'Invalid Tiptap content structure' })
  tiptapContent?: Record<string, any>; // Tiptap JSON document - validated for proper structure

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsEnum([
    'draft',
    'submitted',
    'in_review',
    'revision_requested',
    'approved',
    'published',
    'rejected',
  ])
  status?: BlogStatus;

  @IsOptional()
  @IsEnum(['public', 'member_only'])
  accessLevel?: BlogAccessLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hsnCodePrefixes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  readTimeMinutes?: number;

  // SEO fields
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  // Featured/pinned status
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  // Writer fields (set by system, but can be updated by admin)
  @IsOptional()
  @IsString()
  writerDisplayName?: string;

  @IsOptional()
  @IsString()
  writerBio?: string;

  @IsOptional()
  @IsString()
  writerAvatar?: string;
}
