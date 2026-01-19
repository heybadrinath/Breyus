import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companyMobile?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  founderName?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsEnum(['Buyer', 'Seller', 'Seller and Buyer'])
  role?: string;

  @IsOptional()
  @IsEnum(['international', 'domestic'])
  tradeType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainLineBusiness?: string[];

  @IsOptional()
  @IsString()
  whatsappContact?: string;

  @IsOptional()
  @IsString()
  primaryEmail?: string;

  @IsOptional()
  @IsString()
  alternativeSalesEmail?: string;
}
