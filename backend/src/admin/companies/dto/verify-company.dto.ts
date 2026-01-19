import { IsOptional, IsString } from 'class-validator';

export class VerifyCompanyDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
