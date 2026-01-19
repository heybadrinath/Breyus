import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UNIT_TYPES, UnitType } from '../../schemas/unit.schema';

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string; // Will be uppercased

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  pluralName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol: string;

  @IsString()
  @IsIn(UNIT_TYPES)
  type: UnitType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  baseUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionFactor?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  pluralName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol?: string;

  @IsOptional()
  @IsString()
  @IsIn(UNIT_TYPES)
  type?: UnitType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  baseUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionFactor?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetUnitsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(UNIT_TYPES)
  type?: UnitType;

  @IsOptional()
  @IsString()
  search?: string;
}
