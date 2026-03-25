import {
  IsString,
  MinLength,
  MaxLength,
  IsIn,
  IsOptional,
} from 'class-validator';

/**
 * DTO for users to create a dispute on a trade
 * This is used in the user-facing trade controller
 */
export class CreateDisputeDto {
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
  reason: string;

  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters long' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  description: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string = 'medium';
}
