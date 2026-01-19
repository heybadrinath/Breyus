import { IsBoolean, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

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

export class ScheduleMaintenanceDto {
  @IsDateString()
  scheduledStart: string;

  @IsDateString()
  scheduledEnd: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIPs?: string[];
}
