import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface PurchaseRequestStep1Data {
  companyRevenueRange?: number;
  currency?: string;
  revenueUnit?: string;
  tradeDurationYears?: number;
  productUsage?: string;
}

export interface PurchaseRequestStep2Data {
  industry?: string;
  marketExperienceYears?: number;
  marketCapturePercentage?: number;
}

export interface PurchaseRequestStep3Data {
  price?: number;
  onSale?: boolean;
  priceCurrency?: string;
  sku?: string;
  discount?: number;
  salePrice?: number;
  costOfGoods?: number;
  profit?: number;
  margin?: number;
}

export interface PurchaseRequestStep4Data {
  paymentMode?: string;
  advancePercentage?: number;
  creditTimelineDays?: number;
  paymentTimelineDays?: number;
}

export interface CompletePurchaseRequestData extends 
  PurchaseRequestStep1Data, 
  PurchaseRequestStep2Data, 
  PurchaseRequestStep3Data, 
  PurchaseRequestStep4Data {}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
}

export interface SubmitResponse {
  message: string;
  requestId: string;
}

class PurchaseRequestValidationService {
  
  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }  // Validate individual step - Using client-side validation only
  async validateStep(step: number, data: any): Promise<boolean> {
    console.log(`Validating step ${step} with data:`, data);
    
    // Use client-side validation directly
    return this.validateStepClientSide(step, data);
  }
  // Validate complete purchase request
  async validateComplete(data: CompletePurchaseRequestData): Promise<boolean> {
    const dataToSend = { ...data };

    // Ensure optional payment-related fields are explicitly present in the payload,
    // defaulting to null if undefined. This can help if backend logic
    // expects these keys even when not strictly applicable for the paymentMode.
    if (dataToSend.creditTimelineDays === undefined) {
      (dataToSend as any).creditTimelineDays = null;
    }
    if (dataToSend.paymentTimelineDays === undefined) {
      (dataToSend as any).paymentTimelineDays = null;
    }
    // Ensure advancePercentage is null if not applicable and undefined
    if (dataToSend.paymentMode !== 'advance' && dataToSend.advancePercentage === undefined) {
      (dataToSend as any).advancePercentage = null;
    }
    // If paymentMode is 'advance', ensure advancePercentage is present or null
    if (dataToSend.paymentMode === 'advance' && dataToSend.advancePercentage === undefined) {
      (dataToSend as any).advancePercentage = null;
    }


    console.log('Attempting to validate complete request with data (first 500 chars):', JSON.stringify(dataToSend).substring(0, 500));
    const targetUrl = `${API_BASE_URL}/backend/trades/purchase-request/validate-complete`;
    console.log('Target URL for validateComplete:', targetUrl);
    try {
      const response: AxiosResponse<ValidationResponse> = await axios.post(
        targetUrl,
        dataToSend, // Use the modified dataToSend object
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.valid && response.data.errors) {
        const errorMessage = response.data.errors.join(', ');
        console.error('Backend validation failed (2xx response):', errorMessage);
        throw new Error(errorMessage);
      }
      
      return response.data.valid;
    } catch (error) {
      console.error('Detailed error in validateComplete catch block:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error status:', error.response?.status);
        console.error('Axios error response data:', JSON.stringify(error.response?.data).substring(0, 500));
        // console.error('Axios error request headers:', error.request?.headers); // Can be verbose
        
        let message = 'Validation failed due to a server error.';
        if (error.response?.data) {
          if (typeof error.response.data === 'string' && error.response.data.trim() !== '') {
            message = error.response.data.trim();
          } else if (error.response.data.message) {
            if (Array.isArray(error.response.data.message)) {
              message = error.response.data.message.join(', ');
            } else if (typeof error.response.data.message === 'string' && error.response.data.message.trim() !== '') {
              message = error.response.data.message.trim();
            } else if (typeof error.response.data.message !== 'string' && typeof error.response.data.message !== 'undefined') {
              // If .message is not a string or array of strings (e.g. an object)
              message = `Validation error: ${JSON.stringify(error.response.data.message).substring(0, 200)}`;
            }
          } else if (typeof error.response.data === 'object' && Object.keys(error.response.data).length > 0) {
            // If no .message field, but data object has other fields, serialize it.
            message = `Server error: ${JSON.stringify(error.response.data).substring(0, 200)}`;
          }
        } else if (error.message && !message.includes(error.message)) { 
            message = `${message} (${error.message})`;
        }
        console.error('Throwing error from AxiosError block:', message);
        throw new Error(message);

      } else if (error instanceof Error) { // Non-Axios error
        console.error('Non-Axios error in validateComplete:', error.message, error.stack);
        throw error; // Re-throw the original error
      } else { // Unknown error type
        console.error('Unknown error type in validateComplete:', error);
        throw new Error('An unknown error occurred during validation');
      }
    }
  }

  // Submit purchase request
  async submit(data: CompletePurchaseRequestData): Promise<SubmitResponse> {
    try {
      const response: AxiosResponse<SubmitResponse> = await axios.post(
        `${API_BASE_URL}/backend/trades/purchase-request/submit`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to submit purchase request');
      }
      throw new Error('Network error occurred during submission');
    }
  }

  // Validation helpers for frontend use
  validateStep1Data(data: PurchaseRequestStep1Data): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.companyRevenueRange || data.companyRevenueRange <= 0) {
      errors.push('Company revenue range is required and must be greater than 0');
    }

    if (!data.currency || !['USD', 'INR'].includes(data.currency)) {
      errors.push('Currency is required and must be USD or INR');
    }

    if (!data.revenueUnit || !['Crore', 'Million'].includes(data.revenueUnit)) {
      errors.push('Revenue unit is required and must be Crore or Million');
    }

    if (!data.tradeDurationYears || data.tradeDurationYears < 1) {
      errors.push('Trade duration is required and must be at least 1 year');
    }

    if (!data.productUsage || data.productUsage.trim().length === 0) {
      errors.push('Product usage description is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateStep2Data(data: PurchaseRequestStep2Data): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.industry || data.industry.trim().length === 0) {
      errors.push('Industry information is required');
    }

    if (data.marketExperienceYears === undefined || data.marketExperienceYears < 0) {
      errors.push('Market experience is required and cannot be negative');
    }

    if (data.marketCapturePercentage === undefined || data.marketCapturePercentage < 0 || data.marketCapturePercentage > 100) {
      errors.push('Market capture percentage is required and must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateStep3Data(data: PurchaseRequestStep3Data): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.price || data.price <= 0) {
      errors.push('Price is required and must be greater than 0');
    }

    if (!data.priceCurrency || !['USD', 'INR', 'EUR'].includes(data.priceCurrency)) {
      errors.push('Price currency is required and must be USD, INR, or EUR');
    }

    if (data.discount !== undefined && (data.discount < 0 || data.discount > 100)) {
      errors.push('Discount must be between 0 and 100%');
    }

    if (data.margin !== undefined && (data.margin < 0 || data.margin > 100)) {
      errors.push('Margin must be between 0 and 100%');
    }

    if (data.salePrice !== undefined && data.salePrice < 0) {
      errors.push('Sale price cannot be negative');
    }

    if (data.costOfGoods !== undefined && data.costOfGoods < 0) {
      errors.push('Cost of goods cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateStep4Data(data: PurchaseRequestStep4Data): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.paymentMode || !['advance', 'credit', 'open'].includes(data.paymentMode)) {
      errors.push('Payment mode is required and must be advance, credit, or open');
    }

    if (data.paymentMode === 'advance') {
      if (data.advancePercentage === undefined || data.advancePercentage < 0 || data.advancePercentage > 100) {
        errors.push('Advance percentage is required and must be between 0 and 100%');
      }
    }

    if (data.paymentMode === 'credit') {
      if (!data.creditTimelineDays || data.creditTimelineDays < 1) {
        errors.push('Credit timeline is required and must be at least 1 day');
      }
    }

    if (data.paymentMode === 'open') {
      if (!data.paymentTimelineDays || data.paymentTimelineDays < 1) {
        errors.push('Payment timeline is required and must be at least 1 day');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Client-side validation fallback
  private validateStepClientSide(step: number, data: any): boolean {
    try {
      let validation: { valid: boolean; errors: string[] };
      
      switch (step) {
        case 1:
          validation = this.validateStep1Data(data);
          break;
        case 2:
          validation = this.validateStep2Data(data);
          break;
        case 3:
          validation = this.validateStep3Data(data);
          break;
        case 4:
          validation = this.validateStep4Data(data);
          break;
        default:
          throw new Error('Invalid step number');
      }
      
      if (!validation.valid && validation.errors.length > 0) {
        throw new Error(validation.errors.join(', '));
      }
      
      return validation.valid;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Client-side validation failed');
    }
  }
}

const purchaseRequestValidationService = new PurchaseRequestValidationService();
export default purchaseRequestValidationService;
