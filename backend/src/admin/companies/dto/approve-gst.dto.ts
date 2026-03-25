import { IsOptional, IsString } from 'class-validator';

export class ApproveGstDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
