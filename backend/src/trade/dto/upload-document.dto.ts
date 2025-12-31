import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

/**
 * Document type enum
 */
export type DocumentType = 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof';

/**
 * Base DTO for all document uploads
 */
export class BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * DTO for uploading SCO (Soft Corporate Offer) document
 * Only sellers can upload SCO after negotiation is accepted
 */
export class UploadSCODto extends BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    termsAccepted?: string; // Checkbox confirmation
}

/**
 * DTO for uploading ICPO (Irrevocable Corporate Purchase Order) document
 * Only buyers can upload ICPO after receiving SCO
 */
export class UploadICPODto extends BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    icpoReference?: string; // Reference number for the ICPO
}

/**
 * DTO for uploading SPA (Sales Purchase Agreement) document
 * Either party can upload SPA
 */
export class UploadSPADto extends BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    signingParty?: 'buyer' | 'seller'; // Who is uploading/signing
}

/**
 * DTO for uploading BoL (Bill of Lading) document
 * Only sellers can upload BoL after payment is verified
 */
export class UploadBoLDto extends BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    bolNumber?: string; // Bill of Lading number

    @IsOptional()
    @IsString()
    shippingCarrier?: string; // Carrier/shipping company name

    @IsOptional()
    @IsString()
    vesselName?: string; // Ship/vessel name
}

/**
 * DTO for uploading Payment Proof document
 * Only buyers can upload payment proof
 */
export class UploadPaymentProofDto extends BaseUploadDocumentDto {
    @IsOptional()
    @IsString()
    amount?: string; // Amount paid

    @IsOptional()
    @IsString()
    transactionId?: string; // Bank transaction reference

    @IsOptional()
    @IsString()
    paymentDate?: string; // Date of payment
}

/**
 * DTO for advancing trade phase
 */
export class AdvancePhaseDto {
    @IsEnum(['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'])
    newPhase: 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED';

    @IsOptional()
    @IsString()
    reason?: string;
}

/**
 * DTO for updating document status (admin/verification)
 */
export class UpdateDocumentStatusDto {
    @IsEnum(['sco', 'icpo', 'spa', 'bol', 'payment-proof'])
    documentType: DocumentType;

    @IsEnum(['pending', 'uploaded', 'approved', 'rejected'])
    status: 'pending' | 'uploaded' | 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    verificationNotes?: string;
}

/**
 * DTO for signing a document with e-signature
 */
export class SignDocumentDto {
    @IsNotEmpty()
    @IsString()
    signatureDataUrl: string; // Base64 PNG data URL of the signature
}
