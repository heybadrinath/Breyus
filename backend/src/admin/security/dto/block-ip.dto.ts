import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIP,
  MinLength,
  MaxLength,
} from 'class-validator';

export class BlockIPDto {
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Reason must be at least 5 characters' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string; // If not provided, permanent block
}
