import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BlogStatus, BlogAccessLevel } from '../schemas/blog-post.schema';

/**
 * DTO for querying published blog posts (public endpoints)
 * Supports pagination, filtering, and sorting
 */
export class PublicBlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsIn(['publishedAt', 'viewCount', 'title', 'likeCount', 'commentCount'])
  sortBy?:
    | 'publishedAt'
    | 'viewCount'
    | 'title'
    | 'likeCount'
    | 'commentCount' = 'publishedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * DTO for personalized blog queries
 * Uses user's product data for interest matching
 */
export class PersonalizedBlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 6;
}

/**
 * DTO for admin blog queries (all posts including drafts)
 * Extended filtering options for content management
 */
export class AdminBlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

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
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  writerId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean = false;

  @IsOptional()
  @IsIn([
    'createdAt',
    'updatedAt',
    'publishedAt',
    'title',
    'viewCount',
    'likeCount',
    'submittedAt',
  ])
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'publishedAt'
    | 'title'
    | 'viewCount'
    | 'likeCount'
    | 'submittedAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
