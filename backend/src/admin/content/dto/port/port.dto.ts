import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsMongoId,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const PORT_TYPES = ['sea', 'air', 'land'] as const;
export type PortType = (typeof PORT_TYPES)[number];

export class CreatePortDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(10)
  code: string; // UN/LOCODE

  @IsMongoId()
  country: string;

  @IsIn(PORT_TYPES)
  type: PortType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdatePortDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  code?: string;

  @IsOptional()
  @IsMongoId()
  country?: string;

  @IsOptional()
  @IsIn(PORT_TYPES)
  type?: PortType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetPortsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  country?: string;

  @IsOptional()
  @IsIn(PORT_TYPES)
  type?: PortType;

  @IsOptional()
  @IsString()
  search?: string;

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
