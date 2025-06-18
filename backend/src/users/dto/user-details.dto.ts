import { IsOptional, IsString } from 'class-validator';

export class UserDetailsDto {
  // Contact Information
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  alternateNumber1?: string;

  @IsOptional()
  @IsString()
  alternateNumber2?: string;

  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // Company Information
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  socials?: string;

  // Bank Details
  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  //Buyer address
  BuyercontactNumber?: string;
  Country?: string;
  State?: string;
  City?: string;
  Address?: string;
  

} 