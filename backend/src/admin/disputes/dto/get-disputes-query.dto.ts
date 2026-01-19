import { IsOptional, IsString, IsNumber, IsIn, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetDisputesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['open', 'under_review', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsIn([
    'payment_issue',
    'quality_issue',
    'delivery_delay',
    'documentation_problem',
    'communication_issue',
    'pricing_dispute',
    'contract_breach',
    'other',
  ])
  reason?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unassigned?: boolean;

  @IsOptional()
  @IsString()
  tradeId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['createdAt', 'priority', 'status', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
