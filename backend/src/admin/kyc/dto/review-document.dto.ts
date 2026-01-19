import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ApproveDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectDocumentDto {
  @IsString()
  @MinLength(10, { message: 'Please provide a reason for rejection (at least 10 characters)' })
  @MaxLength(500)
  notes: string;
}
