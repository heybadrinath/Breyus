import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateDisputeStatusDto {
  @IsIn(['open', 'under_review', 'resolved', 'closed'])
  status: 'open' | 'under_review' | 'resolved' | 'closed';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
