import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
] as const;

export type Continent = (typeof CONTINENTS)[number];

export class CreateCountryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, { message: 'ISO code must be 2 uppercase letters' })
  isoCode: string; // ISO 3166-1 alpha-2

  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, { message: 'ISO3 code must be 3 uppercase letters' })
  isoCode3: string; // ISO 3166-1 alpha-3

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  flagEmoji?: string;

  @IsIn(CONTINENTS)
  continent: Continent;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  flagEmoji?: string;

  @IsOptional()
  @IsIn(CONTINENTS)
  continent?: Continent;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetCountriesQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(CONTINENTS)
  continent?: Continent;

  @IsOptional()
  @IsString()
  search?: string;
}
