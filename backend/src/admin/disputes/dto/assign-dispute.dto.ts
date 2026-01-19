import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class AssignDisputeDto {
  @IsMongoId({ message: 'Invalid admin ID' })
  adminId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SelfAssignDisputeDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
