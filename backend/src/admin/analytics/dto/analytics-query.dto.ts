import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}

export class ExportAnalyticsDto {
  @IsIn(['csv', 'pdf'])
  type: 'csv' | 'pdf';

  @IsIn(['all', 'overview', 'trades', 'users', 'financial'])
  section: 'all' | 'overview' | 'trades' | 'users' | 'financial';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
