import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockType } from '../schemas/blog-post.schema';

/**
 * DTO for block content within blog posts
 * Validates the structure of Notion-style content blocks
 */
class BlockMetaDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

class BlockContentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum([
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'bulletList',
    'numberedList',
    'image',
    'quote',
    'divider',
    'code',
  ])
  type: BlockType;

  @IsString()
  content: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlockMetaDto)
  meta?: BlockMetaDto;
}

/**
 * DTO for creating a new blog post
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockContentDto)
  content: BlockContentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string; // Auto-generated from content if not provided

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';

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
}
