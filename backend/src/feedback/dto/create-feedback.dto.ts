import { IsString, IsNumber, IsEnum, Min, Max, IsOptional, IsMongoId, IsArray, IsObject } from 'class-validator';
import { FeedbackType } from '../feedback.schema';

export class CreateFeedbackDto {
  @IsMongoId()
  tradeId: string;

  @IsEnum(['seller', 'delivery', 'product'])
  feedbackType: FeedbackType;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  details?: Record<string, string>;
}

export class UpdateFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  details?: Record<string, string>;
}

export class GetFeedbackDto {
  @IsMongoId()
  @IsOptional()
  tradeId?: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsEnum(['seller', 'delivery', 'product'])
  @IsOptional()
  feedbackType?: FeedbackType;
}
