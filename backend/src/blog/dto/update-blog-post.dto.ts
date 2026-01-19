import {
  IsString,
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
 * DTO for block content (same as create)
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
 * DTO for updating an existing blog post
 * All fields are optional for partial updates
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockContentDto)
  content?: BlockContentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

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
  readTimeMinutes?: number;
}
