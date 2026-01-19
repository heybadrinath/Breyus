import { IsOptional, IsString, IsNumber, IsIn, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetTradesQueryDto {
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
  @IsIn(['pending', 'countered', 'buyer_responded', 'accepted', 'rejected', 'cancelled'])
  negotiationStatus?: string;

  @IsOptional()
  @IsIn(['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED', 'CANCELLED'])
  tradePhase?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isStalled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasDispute?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'lastPhaseChangeAt'])
  sortBy?: string = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  stalledDays?: number = 7;
}
