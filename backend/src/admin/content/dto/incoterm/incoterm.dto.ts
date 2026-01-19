import {
  IsString,
  IsOptional,
  IsIn,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export const INCOTERM_CODES = [
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
] as const;

export type IncotermCode = (typeof INCOTERM_CODES)[number];

export const TRANSPORT_MODES = ['any', 'sea_inland'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const COST_PARTIES = ['Buyer', 'Seller'] as const;
export type CostParty = (typeof COST_PARTIES)[number];

export class CostAllocationDto {
  @IsOptional()
  @IsIn(COST_PARTIES)
  commercialInvoice?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  packagingQualityControl?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  loadingInlandDelivery?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  exportDutyTaxes?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  originTerminalHandling?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  insurance?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  carriageCharges?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  destinationTerminalHandling?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  deliveryToDestination?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  unloadingAtDestination?: CostParty;

  @IsOptional()
  @IsIn(COST_PARTIES)
  importDutyTaxes?: CostParty;
}

export class UpdateIncotermDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  riskTransferDescription?: string;

  @IsOptional()
  @IsIn(TRANSPORT_MODES)
  transportMode?: TransportMode;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CostAllocationDto)
  costAllocation?: CostAllocationDto;
}

export class GetIncotermsQueryDto {
  @IsOptional()
  @IsIn(TRANSPORT_MODES)
  transportMode?: TransportMode;
}
