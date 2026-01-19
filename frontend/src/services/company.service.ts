const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/company";

export interface DeliveryAddress {
    fullName: string;
    mobileNumber: string;
    pincode: string;
    streetName: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    additionalDetails?: string;
}

export const getDeliveryAddresses = async (): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch delivery addresses: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching delivery addresses:', error);
        throw error;
    }
};

export const addDeliveryAddress = async (address: DeliveryAddress): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(address),
        });

        if (!response.ok) {
            throw new Error(`Failed to add delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error adding delivery address:', error);
        throw error;
    }
};

export const updateDeliveryAddress = async (index: number, address: DeliveryAddress): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses/${index}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(address),
        });

        if (!response.ok) {
            throw new Error(`Failed to update delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error updating delivery address:', error);
        throw error;
    }
};

export const deleteDeliveryAddress = async (index: number): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses/${index}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error deleting delivery address:', error);
        throw error;
    }
};

// Bank Information interface
export interface BankInfo {
    ifscCode?: string;
    accountNumber?: string;
    accountHolderName?: string;
    bankAddress?: string;
    bankBranch?: string;
}

// Trade Details interface
export interface TradeDetails {
    emergingInterest?: string;
    agreedToTerms?: boolean;
    cisDocument?: string;
}

// Billing Preferences interface (Settings Page)
export interface BillingPreferences {
    invoiceEmail?: string;
    useExistingEmail?: boolean;
}

export interface CompanyProfile {
    companyName?: string;
    companyAddress?: string;
    companyMobile?: string;
    taxId?: string;
    founderName?: string;
    websiteUrl?: string;
    role?: string;
    tradeType?: string;
    mainLineBusiness?: string[];
    // New fields
    bankInfo?: BankInfo;
    tradeDetails?: TradeDetails;
    whatsappContact?: string;
    primaryEmail?: string;
    alternativeSalesEmail?: string;
    // Settings page fields
    profilePicture?: string;
    bannerImage?: string;
    billingPreferences?: BillingPreferences;
}

export const getCompanyProfile = async (): Promise<CompanyProfile> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/profile`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch company profile: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || {};
    } catch (error) {
        console.error('Error fetching company profile:', error);
        throw error;
    }
};

export const updateCompanyProfile = async (profileData: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update company profile: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || {};
    } catch (error) {
        console.error('Error updating company profile:', error);
        throw error;
    }
};

export const uploadCisDocument = async (file: File): Promise<{ cisDocument: string; profile: CompanyProfile }> => {
    try {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${BACKEND_END_POINT}/upload-cis`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload CIS document: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error uploading CIS document:', error);
        throw error;
    }
};

// KYC Document Types (Phase 4)
export type KycDocumentType = 'cis' | 'passport' | 'tax_certificate' | 'business_registration' | 'other';
export type KycDocumentStatus = 'pending' | 'approved' | 'rejected';

export interface KycDocument {
    _id: string;
    type: KycDocumentType;
    customName: string;
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    status: KycDocumentStatus;
    uploadedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}

export interface KycStatus {
    isKycVerified: boolean;
    documents: KycDocument[];
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
}

export const KYC_DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string> = {
    cis: 'CIS (Customer Information Sheet)',
    passport: 'Passport',
    tax_certificate: 'Tax Certificate',
    business_registration: 'Business Registration',
    other: 'Other',
};

export const getKycDocuments = async (): Promise<KycDocument[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/kyc-documents`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch KYC documents: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching KYC documents:', error);
        throw error;
    }
};

export const getKycStatus = async (): Promise<KycStatus> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/kyc-status`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch KYC status: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching KYC status:', error);
        throw error;
    }
};

export const uploadKycDocument = async (
    file: File,
    documentType: KycDocumentType,
    customName: string
): Promise<KycDocument> => {
    try {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('documentType', documentType);
        formData.append('customName', customName);

        const response = await fetch(`${BACKEND_END_POINT}/kyc-documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to upload KYC document: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error uploading KYC document:', error);
        throw error;
    }
};

export const deleteKycDocument = async (documentId: string): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/kyc-documents/${documentId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete KYC document: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting KYC document:', error);
        throw error;
    }
};

// Profile Media Functions (Settings Page)

export const uploadProfilePicture = async (file: File): Promise<{ profilePicture: string }> => {
    try {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${BACKEND_END_POINT}/upload-profile-picture`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to upload profile picture: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
};

export const uploadBanner = async (file: File): Promise<{ bannerImage: string }> => {
    try {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${BACKEND_END_POINT}/upload-banner`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to upload banner image: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error uploading banner image:', error);
        throw error;
    }
};

export const deleteProfilePicture = async (): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/profile-picture`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete profile picture: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        throw error;
    }
};

export const deleteBanner = async (): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/banner`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete banner image: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting banner image:', error);
        throw error;
    }
}; 