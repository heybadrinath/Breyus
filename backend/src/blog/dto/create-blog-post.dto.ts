import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { BlogStatus, BlogAccessLevel } from '../schemas/blog-post.schema';
import { IsTiptapDocument } from '../validators/tiptap.validator';

/**
 * DTO for creating a new blog post with Tiptap content
 * All fields are validated for proper content creation
 */
export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  slug?: string; // Auto-generated if not provided

  @IsOptional()
  @IsTiptapDocument({ message: 'Invalid Tiptap content structure' })
  tiptapContent?: Record<string, any>; // Tiptap JSON document - validated for proper structure

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string; // Auto-generated from content if not provided

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
  readTimeMinutes?: number; // Auto-calculated if not provided

  // SEO fields
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;
}
