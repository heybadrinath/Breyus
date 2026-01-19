import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export class AnalyticsQueryDto {
    @IsOptional()
    @IsString()
    @IsIn(['7d', '30d', '90d', '1y', 'custom'])
    range?: TimeRange = '7d';

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export function getDateRangeFromQuery(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    if (query.range === 'custom' && query.startDate && query.endDate) {
        startDate = new Date(query.startDate);
        return { startDate, endDate: new Date(query.endDate) };
    }

    switch (query.range) {
        case '30d':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1y':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case '7d':
        default:
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
    }

    return { startDate, endDate };
}

export function getPreviousPeriodRange(startDate: Date, endDate: Date): { prevStartDate: Date; prevEndDate: Date } {
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1); // 1ms before current period start
    const prevStartDate = new Date(prevEndDate.getTime() - periodMs);

    return { prevStartDate, prevEndDate };
}
