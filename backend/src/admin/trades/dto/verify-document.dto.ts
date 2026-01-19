import { IsString, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Document types that can be verified by admin
 */
export const VERIFIABLE_DOCUMENT_TYPES = [
  'sco',
  'icpo',
  'spa',
  'bol',
  'payment-proof',
] as const;

export type VerifiableDocumentType = (typeof VERIFIABLE_DOCUMENT_TYPES)[number];

/**
 * Document verification statuses
 */
export const VERIFICATION_STATUSES = ['approved', 'rejected'] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/**
 * DTO for admin document verification
 * Allows admins to approve or reject trade documents
 */
export class VerifyDocumentDto {
  @IsIn(VERIFIABLE_DOCUMENT_TYPES, {
    message: `documentType must be one of: ${VERIFIABLE_DOCUMENT_TYPES.join(', ')}`,
  })
  documentType: VerifiableDocumentType;

  @IsIn(VERIFICATION_STATUSES, {
    message: `status must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
  })
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Notes must be at least 5 characters when provided' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
