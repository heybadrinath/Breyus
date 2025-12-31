import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelTradeDto {
    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    reason?: string;
}
