import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a conversation
 * Supports two modes:
 * 1. Product-based conversation (existing flow): requires 'product' field
 * 2. Direct company conversation (new): requires 'targetCompanyId' field
 * At least one of these must be provided.
 */
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  targetCompanyId?: string;
}
