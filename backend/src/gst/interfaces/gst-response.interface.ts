/**
 * Cashfree GST Verification API Response Interfaces
 * API Endpoint: POST https://api.cashfree.com/verification/gst
 */

export interface CashfreeGSTResponse {
  status: 'VALID' | 'INVALID';
  gstin: string;
  legal_name: string;
  trade_name?: string;
  status_of_gstin: 'Active' | 'Cancelled' | 'Suspended' | 'Inactive';
  registration_date?: string;
  address?: string;
  state_jurisdiction?: string;
  nature_of_business?: string[];
}

export interface GSTVerificationResult {
  status: 'VALID' | 'INVALID';
  gstin: string;
  legalName: string;
  tradeName?: string;
  statusOfGstin: 'Active' | 'Cancelled' | 'Suspended' | 'Inactive';
  registrationDate?: string;
  address?: string;
  stateJurisdiction?: string;
  natureOfBusiness?: string[];
}

export interface GSTVerificationData {
  legalName: string;
  tradeName?: string;
  status: string;
  registrationDate?: string;
  stateJurisdiction?: string;
}

export interface GSTFormatValidationResult {
  valid: boolean;
  error?: string;
}
