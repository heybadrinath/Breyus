import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { AlertEventType } from '../schemas/alert-rule.schema';

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AlertEventType)
  eventType: AlertEventType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  threshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeWindowMinutes?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440) // Max 24 hours
  cooldownMinutes?: number;
}

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  threshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeWindowMinutes?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients?: string[];

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  cooldownMinutes?: number;
}
