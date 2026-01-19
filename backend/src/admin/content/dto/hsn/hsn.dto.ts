import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateHSNCodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  @Matches(/^\d+$/, { message: 'HSN code must contain only digits' })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateHSNCodeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetHSNCodesQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class BulkImportHSNDto {
  // CSV data will be parsed and validated separately
  // This DTO represents the parsed row
  @IsString()
  @Matches(/^\d+$/, { message: 'HSN code must contain only digits' })
  code: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsString()
  category?: string;
}
