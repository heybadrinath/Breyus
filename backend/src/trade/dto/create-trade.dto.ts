import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// Define all possible Incoterms
type IncotermType =
  | 'EXW'
  | 'FCA'
  | 'FAS'
  | 'FOB'
  | 'CFR'
  | 'CIF'
  | 'CPT'
  | 'CIP'
  | 'DAP'
  | 'DPU'
  | 'DDP';

// Define the structure for each Incoterm row
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms
class IncotermsDto {
  @IsOptional()
  @IsEnum([
    'EXW',
    'FCA',
    'FAS',
    'FOB',
    'CFR',
    'CIF',
    'CPT',
    'CIP',
    'DAP',
    'DPU',
    'DDP',
  ])
  selectedIncoterm?: IncotermType;

  @IsOptional()
  @IsObject()
  selectedIncotermData?: IncotermRowData;

  @IsOptional()
  @IsObject()
  defaults?: Record<IncotermType, IncotermRowData>;
}

// Address DTO
class AddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;
}

// Payment method DTO
class PaymentMethodDto {
  @IsEnum(['advance', 'credit', 'openAccount'])
  type: 'advance' | 'credit' | 'openAccount';

  @IsEnum(['RTGS', 'LetterOfCredit'])
  method: 'RTGS' | 'LetterOfCredit';

  @IsOptional()
  @IsString()
  percentage?: string;

  @IsOptional()
  @IsString()
  days?: string;
}

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  // Step 1: Negotiation (Optional)
  @IsOptional()
  @IsString()
  buyerOfferedPrice?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IncotermsDto)
  buyerIncoterms?: IncotermsDto;

  @IsOptional()
  @IsString()
  buyerMessage?: string;

  // Step 2: Address
  @ValidateNested()
  @Type(() => AddressDto)
  selectedAddress: AddressDto;

  // Step 3: Trade Queries
  @IsOptional()
  @IsString()
  buyerIndustryType?: string;

  @IsString()
  @IsNotEmpty()
  buyerMarketYears: string;

  @IsOptional()
  @IsString()
  marketCapture?: string;

  @IsString()
  @IsNotEmpty()
  tradeYears: string;

  @IsOptional()
  @IsString()
  productUsage?: string;

  // Nearest importing port (from dropdown or custom input)
  @IsOptional()
  @IsString()
  nearestPort?: string;

  // Buyer's CIS document path (from profile or uploaded)
  @IsOptional()
  @IsString()
  buyerCisDocument?: string;

  // Step 4: Payment
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}
