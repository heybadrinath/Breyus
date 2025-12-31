import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';
import { NotificationType, NotificationPriority } from '../schema/notification.schema';

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
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
    type: NotificationType;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    message: string;

    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority?: NotificationPriority;

    @IsOptional()
    @IsString()
    tradeId?: string;

    @IsOptional()
    @IsString()
    conversationId?: string;

    @IsOptional()
    @IsString()
    actionUrl?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
