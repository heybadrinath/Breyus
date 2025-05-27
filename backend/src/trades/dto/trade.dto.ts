import { IsNotEmpty, IsUUID, IsNumber, IsEnum, IsString, IsOptional, IsBoolean, Min, Max, IsObject, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TradeStatus, TradeType } from '../entities/trade.entity';

export class CreateTradeRequestDto {
  @IsNotEmpty()
  @IsUUID()
  seller_id: string;

  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  offered_price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  buyer_message?: string;

  @IsOptional()
  @IsEnum(TradeType)
  trade_type?: TradeType;

  @IsOptional()
  @IsObject()
  trade_terms?: Record<string, any>;

  @IsOptional()
  @IsObject()
  shipping_details?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}

export class UpdateTradeStatusDto {
  @IsNotEmpty()
  @IsEnum(TradeStatus)
  status: TradeStatus;

  @IsOptional()
  @IsString()
  seller_message?: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

export class CounterOfferDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  counter_offer_price: number;

  @IsOptional()
  @IsString()
  seller_message?: string;

  @IsOptional()
  @IsObject()
  trade_terms?: Record<string, any>;
}

export class TradeResponseDto {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  status: TradeStatus;
  trade_type: TradeType;
  offered_price: number;
  counter_offer_price?: number;
  quantity: number;
  buyer_message?: string;
  seller_message?: string;
  rejection_reason?: string;
  trade_terms?: Record<string, any>;
  shipping_details?: Record<string, any>;
  expires_at?: Date;
  accepted_at?: Date;
  completed_at?: Date;
  final_price?: number;
  is_urgent: boolean;
  counter_offer_count: number;
  created_at: Date;
  updated_at: Date;
  buyer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  seller?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    productImage?: string;
  };
}

export class TradeFilterDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected', 'counter_offered', 'expired', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsIn(['purchase_request', 'bulk_order', 'spot_trade', 'contract_trade'])
  trade_type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';
} 