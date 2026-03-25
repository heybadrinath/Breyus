import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SubscriptionSource } from '../schemas/newsletter-subscriber.schema';

export class SubscribeDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsEnum(SubscriptionSource)
  @IsOptional()
  source?: SubscriptionSource = SubscriptionSource.BLOG_HOMEPAGE;
}

export class AdminSubscriberQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isActive?: boolean;

  @IsOptional()
  @IsEnum(SubscriptionSource)
  source?: SubscriptionSource;

  @IsOptional()
  @IsString()
  sortBy?: string = 'subscribedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
