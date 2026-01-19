import { IsString, IsIn, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Valid trade phases that admin can force-change to
 */
export const TRADE_PHASES = [
  'PR',
  'SCO',
  'ICPO',
  'SPA',
  'PAYMENT',
  'BOL',
  'COMPLETED',
  'CANCELLED',
] as const;

export type TradePhase = (typeof TRADE_PHASES)[number];

/**
 * DTO for admin force phase change
 * Allows admins to manually advance or revert trade phases
 */
export class ForcePhaseChangeDto {
  @IsIn(TRADE_PHASES, {
    message: `newPhase must be one of: ${TRADE_PHASES.join(', ')}`,
  })
  newPhase: TradePhase;

  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters (be descriptive)' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;

  @IsOptional()
  @IsBoolean()
  notifyParties?: boolean;
}
