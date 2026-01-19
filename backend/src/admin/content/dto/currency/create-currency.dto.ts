import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  code: string; // ISO 4217 code

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol: string;

  @IsIn(['before', 'after'])
  symbolPosition: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  decimalPlaces?: number = 2;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateCurrencyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol?: string;

  @IsOptional()
  @IsIn(['before', 'after'])
  symbolPosition?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  decimalPlaces?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetCurrenciesQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
