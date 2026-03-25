import {
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
} from 'class-validator';

export class UpdateMaintenanceDto {
  @IsBoolean()
  isEnabled: boolean;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  estimatedEndTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIPs?: string[];
}
