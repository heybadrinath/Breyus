import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../schema/notification.schema';

export class NotificationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    unreadOnly?: boolean;

    @IsOptional()
    @IsEnum([
        'trade_created',
        'counter_offer',
        'trade_accepted',
        'trade_rejected',
        'document_uploaded',
        'documents_invalidated',
        'phase_advanced',
        'trade_completed',
        'trade_cancelled',
        'new_message',
        'analysis_completed'
    ])
    type?: NotificationType;

    @IsOptional()
    @IsString()
    category?: 'trade' | 'message' | 'system';
}
