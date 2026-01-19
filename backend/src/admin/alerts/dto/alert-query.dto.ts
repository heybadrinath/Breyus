import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AlertEventType } from '../schemas/alert-rule.schema';
import { AlertEmailStatus } from '../schemas/alert-history.schema';

export class GetAlertRulesQueryDto {
  @IsOptional()
  @IsEnum(AlertEventType)
  eventType?: AlertEventType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEnabled?: boolean;
}

export class GetAlertHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsEnum(AlertEventType)
  eventType?: AlertEventType;

  @IsOptional()
  @IsEnum(AlertEmailStatus)
  emailStatus?: AlertEmailStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
