const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/trade";

export interface Address {
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

export interface PaymentMethod {
    type: 'advance' | 'credit' | 'openAccount';
    method: 'RTGS' | 'LetterOfCredit';
    percentage?: string;
    days?: string;
}

export interface Incoterms {
    selectedIncoterm?: string;
    selectedIncotermData?: Record<string, 'Buyer' | 'Seller'>;
    defaults?: Record<string, Record<string, 'Buyer' | 'Seller'>>;
}

// PHASE 2: Document rejection tracking
export interface DocumentRejectionTracking {
    rejectionCount: number;
    lastRejectionAt?: string;
    lastRejectionReason?: string;
    maxAttempts: number;
}

export interface TradeCompany {
    _id?: string;
    name?: string;
    address?: {
        city?: string;
        state?: string;
        country?: string;
    };
    isKycVerified?: boolean;
    createdAt?: string;
}

export interface CreateTradeRequest {
    productId: string;
    quantity: string;
    quantityUnit: string;
    buyerOfferedPrice?: string;
    buyerIncoterms?: Incoterms;
    buyerMessage?: string;
    selectedAddress: Address;
    buyerIndustryType?: string;
    buyerMarketYears: string;
    marketCapture?: string;
    tradeYears: string;
    productUsage?: string;
    // New fields for PR
    nearestPort?: string;
    buyerCisDocument?: string;
    paymentMethod: PaymentMethod;
}

export interface Trade {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
    };
    buyer: {
        _id: string;
        mail: string;
        company?: TradeCompany;
    };
    seller: {
        _id: string;
        mail: string;
        company?: TradeCompany;
    };
    quantity: string | number;
    quantityUnit: string;
    buyerOfferedPrice?: string | number;
    buyerIncoterms?: Incoterms;
    buyerMessage?: string;
    selectedAddress: Address;
    buyerIndustryType?: string;
    buyerMarketYears: string;
    marketCapture?: string;
    tradeYears: string;
    productUsage?: string;
    // Port and CIS document
    nearestPort?: string;
    buyerCisDocument?: string;
    paymentMethod: PaymentMethod;
    tradeStatus: string;
    // Status fields
    purchaseRequestStatus?: string;
    purchaseOrderStatus?: string;
    negotiationStatus?: string;
    currentNegotiationRound?: number;
    // Seller response fields
    sellerOfferedPrice?: string | number;
    sellerOfferedIncoterms?: Incoterms;
    sellerMessage?: string;
    // Rejection/acceptance tracking
    rejectionReason?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    createdAt: string;
    updatedAt: string;
    // PHASE 2: Document rejection tracking
    scoRejectionTracking?: DocumentRejectionTracking;
    icpoRejectionTracking?: DocumentRejectionTracking;
    spaRejectionTracking?: DocumentRejectionTracking;
    signedSpaRejectionTracking?: DocumentRejectionTracking;
    paymentProofRejectionTracking?: DocumentRejectionTracking;
    bolRejectionTracking?: DocumentRejectionTracking;
    // Auto-cancellation info
    autoCancelledAt?: string;
    autoCancellationReason?: string;
}

export interface TradeResponse {
    statusCode: number;
    message: string;
    data: Trade | Trade[];
}

export const createTradeRequest = async (tradeData: CreateTradeRequest): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(tradeData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create trade request');
        }

        return data;
    } catch (error) {
        console.error('Error creating trade request:', error);
        throw error;
    }
};

export const getUserTrades = async (): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/user-trades`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch user trades');
        }

        return data;
    } catch (error) {
        console.error('Error fetching user trades:', error);
        throw error;
    }
};

export const getSellerTrades = async (): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/seller-trades`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch seller trades');
        }

        return data;
    } catch (error) {
        console.error('Error fetching seller trades:', error);
        throw error;
    }
};

export const getTradeById = async (tradeId: string): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch trade');
        }

        return data;
    } catch (error) {
        console.error('Error fetching trade:', error);
        throw error;
    }
};

export interface CounterOfferData {
    offeredPrice?: string;
    offeredIncoterms?: Incoterms;
    message?: string;
}

export const submitCounterOffer = async (tradeId: string, counterOfferData: CounterOfferData): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/counter-offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(counterOfferData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit counter-offer');
        }

        return data;
    } catch (error) {
        console.error('Error submitting counter-offer:', error);
        throw error;
    }
};

export const buyerRespondToCounter = async (tradeId: string, responseData: CounterOfferData): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/buyer-respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(responseData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit response');
        }

        return data;
    } catch (error) {
        console.error('Error submitting buyer response:', error);
        throw error;
    }
};

export const acceptTrade = async (tradeId: string): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/accept`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to accept trade');
        }

        return data;
    } catch (error) {
        console.error('Error accepting trade:', error);
        throw error;
    }
};

export const rejectTrade = async (tradeId: string, reason?: string): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to reject trade');
        }

        return data;
    } catch (error) {
        console.error('Error rejecting trade:', error);
        throw error;
    }
};

export interface NegotiationHistoryEntry {
    round: number;
    party: 'buyer' | 'seller';
    offeredPrice?: string;
    offeredIncoterms?: Incoterms;
    message?: string;
    timestamp: string;
}

export interface NegotiationHistoryResponse {
    statusCode: number;
    message: string;
    data: {
        tradeId: string;
        negotiationStatus: string;
        currentRound: number;
        history: NegotiationHistoryEntry[];
        buyerCurrentOffer: {
            price?: string;
            incoterms?: Incoterms;
            message?: string;
        };
        sellerCurrentOffer: {
            price?: string;
            incoterms?: Incoterms;
            message?: string;
        };
    };
}

export const getNegotiationHistory = async (tradeId: string): Promise<NegotiationHistoryResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch negotiation history');
        }

        return data;
    } catch (error) {
        console.error('Error fetching negotiation history:', error);
        throw error;
    }
};

// ========================
// Document Upload APIs
// ========================

// PHASE 2 REFACTORING: Added 'signed-spa' type
export type DocumentType = 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof';
export type TradePhase = 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED' | 'CANCELLED';
export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

// ========================
// PHASE 2 REFACTORING: Document Rejection Tracking
// ========================

export interface DocumentRejectionInfo {
    remainingAttempts: number;
    maxAttempts: number;
    isLastAttempt: boolean;
}

export interface DocumentRejectionTracking {
    rejectionCount: number;
    lastRejectionAt?: string;
    lastRejectionReason?: string;
    maxAttempts: number;
}

export interface DocumentInfo {
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
    status: DocumentStatus;
    notes?: string;
    verificationNotes?: string;  // Notes from verification/rejection
    // Single signature fields (for SCO, ICPO, BoL)
    signatureDataUrl?: string;
    signedAt?: string;
    signedBy?: string;
}

// SPA specific document with dual signatures
export interface SPADocumentInfo extends DocumentInfo {
    // Seller signature (Pre-SPA)
    sellerSignatureDataUrl?: string;
    sellerSignedAt?: string;
    sellerSignedBy?: string;
    // Buyer signature (Re-SPA / counter-sign)
    buyerSignatureDataUrl?: string;
    buyerSignedAt?: string;
    buyerSignedBy?: string;
}

// SPA signature status from backend
export interface SPAStatus {
    uploaded: boolean;
    sellerSigned: boolean;
    buyerSigned: boolean;
    fullySigned: boolean;
}

export interface TradeDocumentsResponse {
    statusCode: number;
    message: string;
    data: {
        tradeId: string;
        tradePhase: TradePhase;
        documents: {
            sco?: DocumentInfo;
            icpo?: DocumentInfo;
            spa?: SPADocumentInfo;
            signedSpa?: DocumentInfo;  // PHASE 2: Buyer's signed SPA
            bol?: DocumentInfo;
            paymentProof?: DocumentInfo;
        };
        timestamps: {
            scoSubmittedAt?: string;
            icpoSubmittedAt?: string;
            spaUploadedAt?: string;
            spaSellerSignedAt?: string;
            spaBuyerSignedAt?: string;
            signedSpaSubmittedAt?: string;  // PHASE 2: When buyer uploaded signed SPA
            signedSpaApprovedAt?: string;    // PHASE 2: When seller approved signed SPA
            paymentVerifiedAt?: string;
            bolUploadedAt?: string;
            completedAt?: string;
            autoCancelledAt?: string;        // PHASE 2: Auto-cancellation timestamp
            disputeEligibilityEndsAt?: string; // PHASE 2: 30-day dispute window
        };
        spaStatus?: SPAStatus;
        // PHASE 2 REFACTORING: Rejection tracking for all documents
        rejectionTracking?: {
            sco?: DocumentRejectionTracking;
            icpo?: DocumentRejectionTracking;
            spa?: DocumentRejectionTracking;
            signedSpa?: DocumentRejectionTracking;
            paymentProof?: DocumentRejectionTracking;
            bol?: DocumentRejectionTracking;
        };
    };
}

export const uploadDocument = async (
    tradeId: string,
    documentType: DocumentType,
    file: File,
    notes?: string
): Promise<TradeResponse> => {
    try {
        const formData = new FormData();
        formData.append('files', file);
        if (notes) {
            formData.append('notes', notes);
        }

        const endpoint = documentType === 'payment-proof'
            ? `upload-payment-proof`
            : `upload-${documentType}`;

        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to upload ${documentType}`);
        }

        return data;
    } catch (error) {
        console.error(`Error uploading ${documentType}:`, error);
        throw error;
    }
};

export const uploadSCO = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    return uploadDocument(tradeId, 'sco', file, notes);
};

export const uploadICPO = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    return uploadDocument(tradeId, 'icpo', file, notes);
};

export const uploadSPA = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    return uploadDocument(tradeId, 'spa', file, notes);
};

export const uploadBoL = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    return uploadDocument(tradeId, 'bol', file, notes);
};

export const uploadPaymentProof = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    return uploadDocument(tradeId, 'payment-proof', file, notes);
};

/**
 * ========================
 * PHASE 2 REFACTORING: Upload Signed SPA
 * ========================
 * Buyer uploads their signed copy of the SPA after seller's SPA is approved
 * Flow: Seller uploads SPA → Buyer approves → Buyer uploads signed SPA → Seller approves
 */
export const uploadSignedSpa = async (tradeId: string, file: File, notes?: string): Promise<TradeResponse> => {
    try {
        const formData = new FormData();
        formData.append('files', file);
        if (notes) {
            formData.append('notes', notes);
        }

        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/upload-signed-spa`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload signed SPA');
        }

        return data;
    } catch (error) {
        console.error('Error uploading signed SPA:', error);
        throw error;
    }
};

export const getTradeDocuments = async (tradeId: string): Promise<TradeDocumentsResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/documents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch trade documents');
        }

        return data;
    } catch (error) {
        console.error('Error fetching trade documents:', error);
        throw error;
    }
};

export const advanceTradePhase = async (tradeId: string, newPhase: TradePhase): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/advance-phase`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ newPhase }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to advance trade phase');
        }

        return data;
    } catch (error) {
        console.error('Error advancing trade phase:', error);
        throw error;
    }
};

export const completeTrade = async (tradeId: string): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to complete trade');
        }

        return data;
    } catch (error) {
        console.error('Error completing trade:', error);
        throw error;
    }
};

/**
 * Verify or reject a document
 * Different documents are verified by different parties:
 * - SCO → Buyer verifies
 * - ICPO → Seller verifies
 * - SPA → Buyer approves/rejects (PHASE 2 REFACTORING)
 * - Signed SPA → Seller verifies (PHASE 2 REFACTORING)
 * - Payment Proof → Seller verifies
 * - BoL → Buyer verifies
 *
 * PHASE 2 NOTE: Response now includes rejectionInfo with remainingAttempts
 * when a document is rejected
 */
export const verifyDocument = async (
    tradeId: string,
    documentType: DocumentType,
    status: 'approved' | 'rejected',
    notes?: string
): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/verify-document`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                documentType,
                status,
                verificationNotes: notes
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to verify document');
        }

        return data;
    } catch (error) {
        console.error('Error verifying document:', error);
        throw error;
    }
};

/**
 * Download invoice PDF for a trade
 * Opens the PDF as a file download
 */
export const downloadInvoice = async (tradeId: string): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/invoice`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to download invoice');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-ORD-${tradeId.slice(-8).toUpperCase()}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        throw error;
    }
};

/**
 * Download Purchase Request PDF for a trade
 * Available for any trade (buyer/seller)
 */
export const downloadPurchaseRequest = async (tradeId: string): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/purchase-request-pdf`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to download purchase request');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase-request-PR-${tradeId.slice(-8).toUpperCase()}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading purchase request:', error);
        throw error;
    }
};

/**
 * Download Purchase Order PDF for a trade
 * Only available after trade negotiation is accepted
 */
export const downloadPurchaseOrder = async (tradeId: string): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/purchase-order-pdf`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to download purchase order');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase-order-PO-${tradeId.slice(-8).toUpperCase()}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading purchase order:', error);
        throw error;
    }
};

/**
 * Download a trade document (SCO, ICPO, SPA, BoL, or Payment Proof)
 */
export const downloadTradeDocument = async (
    tradeId: string,
    documentType: 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof'
): Promise<void> => {
    try {
        const response = await fetch(
            `${BACKEND_END_POINT}/${tradeId}/document/${documentType}/download`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to download ${documentType.toUpperCase()} document`);
        }

        // Get the file blob
        const blob = await response.blob();

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${documentType}-document`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(`Error downloading ${documentType} document:`, error);
        throw error;
    }
};

// ========================
// UNREAD COUNTS & BADGE FUNCTIONS
// ========================

export interface UnreadCounts {
    pr: number;
    po: number;
    spa: number;
    ongoing: number;
    history: number;
}

export interface UnreadCountsResponse {
    statusCode: number;
    message: string;
    data: UnreadCounts;
}

/**
 * Get unread counts for trade tabs
 * Returns counts for PR, PO, SPA, and Ongoing tabs
 */
export const getUnreadCounts = async (): Promise<UnreadCountsResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/unread-counts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch unread counts');
        }

        return data;
    } catch (error) {
        console.error('Error fetching unread counts:', error);
        throw error;
    }
};

/**
 * Mark trades as read for a specific tab type
 * @param tabType - The tab type: 'pr', 'po', 'spa', 'ongoing', or 'history'
 */
export const markTradesAsRead = async (tabType: 'pr' | 'po' | 'spa' | 'ongoing' | 'history'): Promise<void> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/mark-read/${tabType}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to mark trades as read');
        }
    } catch (error) {
        console.error('Error marking trades as read:', error);
        throw error;
    }
};

// ========================
// PAGINATION
// ========================

export interface PaginationOptions {
    page?: number;
    limit?: number;
    status?: string;
    phase?: string;
    search?: string;
}

export interface PaginatedTradesResult {
    trades: Trade[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedTradesResponse {
    statusCode: number;
    message: string;
    data: PaginatedTradesResult;
}

/**
 * Get paginated trades for buyer
 */
export const getUserTradesPaginated = async (options: PaginationOptions = {}): Promise<PaginatedTradesResponse> => {
    try {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.status) params.append('status', options.status);
        if (options.phase) params.append('phase', options.phase);
        if (options.search) params.append('search', options.search);

        const response = await fetch(`${BACKEND_END_POINT}/user-trades/paginated?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch paginated trades');
        }

        return data;
    } catch (error) {
        console.error('Error fetching paginated trades:', error);
        throw error;
    }
};

/**
 * Get paginated trades for seller
 */
export const getSellerTradesPaginated = async (options: PaginationOptions = {}): Promise<PaginatedTradesResponse> => {
    try {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.status) params.append('status', options.status);
        if (options.phase) params.append('phase', options.phase);
        if (options.search) params.append('search', options.search);

        const response = await fetch(`${BACKEND_END_POINT}/seller-trades/paginated?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch paginated trades');
        }

        return data;
    } catch (error) {
        console.error('Error fetching paginated trades:', error);
        throw error;
    }
};

// ========================
// TRADE CANCELLATION
// ========================

/**
 * Cancel a trade
 * Rules:
 * - PR phase (pending/countered): Free cancellation
 * - Accepted/SCO phase: Allowed with reason
 * - ICPO phase and beyond: Cannot cancel
 */
export const cancelTrade = async (tradeId: string, reason?: string): Promise<TradeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel trade');
        }

        return data;
    } catch (error) {
        console.error('Error cancelling trade:', error);
        throw error;
    }
};

// ========================
// AUDIT HISTORY
// ========================

export type AuditAction =
    | 'trade_created'
    | 'counter_offer'
    | 'buyer_response'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'document_uploaded'
    | 'document_replaced'
    | 'document_verified'
    | 'document_rejected'
    | 'phase_advanced'
    | 'trade_completed'
    | 'signature_added';

export interface AuditLog {
    _id: string;
    trade: string;
    performedBy: {
        _id: string;
        mail: string;
    };
    action: AuditAction;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    details?: string;
    documentType?: string;
    createdAt: string;
}

export interface AuditHistoryOptions {
    limit?: number;
    offset?: number;
    action?: AuditAction;
}

export interface AuditHistoryResponse {
    statusCode: number;
    message: string;
    data: {
        logs: AuditLog[];
        total: number;
    };
}

/**
 * Get audit history for a trade
 * Returns a timeline of all actions performed on the trade
 */
export const getAuditHistory = async (
    tradeId: string,
    options: AuditHistoryOptions = {}
): Promise<AuditHistoryResponse> => {
    try {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.offset) params.append('offset', options.offset.toString());
        if (options.action) params.append('action', options.action);

        const response = await fetch(
            `${BACKEND_END_POINT}/${tradeId}/audit-history?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch audit history');
        }

        return data;
    } catch (error) {
        console.error('Error fetching audit history:', error);
        throw error;
    }
};

// ========================
// DOCUMENT VERSIONING
// ========================

export interface DocumentVersion {
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    uploadedBy: {
        _id: string;
        mail: string;
    } | string;
    version: number;
    isCurrent: boolean;
}

export interface DocumentVersionsResponse {
    statusCode: number;
    message: string;
    data: {
        tradeId: string;
        documentType: DocumentType;
        versions: DocumentVersion[];
        totalVersions: number;
    };
}

/**
 * Get all versions of a document
 * Returns version history including current and previous versions
 */
export const getDocumentVersions = async (
    tradeId: string,
    documentType: DocumentType
): Promise<DocumentVersionsResponse> => {
    try {
        const response = await fetch(
            `${BACKEND_END_POINT}/${tradeId}/document/${documentType}/versions`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch document versions');
        }

        return data;
    } catch (error) {
        console.error('Error fetching document versions:', error);
        throw error;
    }
};

/**
 * Download a specific version of a document
 * @param version - The version number to download (1-based)
 */
export const downloadDocumentVersion = async (
    tradeId: string,
    documentType: DocumentType,
    version: number
): Promise<void> => {
    try {
        const response = await fetch(
            `${BACKEND_END_POINT}/${tradeId}/document/${documentType}/version/${version}/download`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to download ${documentType} version ${version}`);
        }

        // Get the file blob
        const blob = await response.blob();

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${documentType}-v${version}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(`Error downloading ${documentType} version ${version}:`, error);
        throw error;
    }
};

/**
 * Sign a document with digital signature
 * @param signatureDataUrl - Base64 PNG data URL of the signature
 */
export const signDocument = async (
    tradeId: string,
    documentType: DocumentType,
    signatureDataUrl: string
): Promise<TradeResponse> => {
    try {
        const response = await fetch(
            `${BACKEND_END_POINT}/${tradeId}/document/${documentType}/sign`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ signatureDataUrl }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to sign document');
        }

        return data;
    } catch (error) {
        console.error('Error signing document:', error);
        throw error;
    }
};

// ========================
// DISPUTE APIs
// ========================

export type DisputeReason =
    | 'payment_issue'
    | 'quality_issue'
    | 'delivery_delay'
    | 'documentation_problem'
    | 'communication_issue'
    | 'pricing_dispute'
    | 'contract_breach'
    | 'other';

export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export interface CreateDisputeData {
    reason: DisputeReason;
    description: string;
    priority?: DisputePriority;
}

export interface DisputeMessage {
    _id: string;
    content: string;
    sender: {
        _id: string;
        mail?: string;
        email?: string;
    };
    senderType: 'buyer' | 'seller' | 'admin';
    senderEmail?: string;
    createdAt: string;
    isInternal?: boolean;
}

export interface TradeDispute {
    _id: string;
    trade: string;
    raisedBy: {
        _id: string;
        mail: string;
    };
    raisedByRole: 'buyer' | 'seller';
    raisedByEmail: string;
    reason: DisputeReason;
    description: string;
    priority: DisputePriority;
    status: DisputeStatus;
    assignedAdmin?: {
        _id: string;
        email: string;
        name?: string;
    };
    assignedAdminEmail?: string;
    assignedAt?: string;
    resolutionNotes?: string;
    resolvedAt?: string;
    resolvedBy?: {
        _id: string;
        email: string;
    };
    resolvedByEmail?: string;
    closedAt?: string;
    messages?: DisputeMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface DisputeResponse {
    statusCode: number;
    message: string;
    data: TradeDispute | null;
}

export interface DisputeMessageData {
    content: string;
}

/**
 * Raise a dispute on a trade
 * Either buyer or seller can raise a dispute on their trade
 */
export const raiseDispute = async (
    tradeId: string,
    disputeData: CreateDisputeData
): Promise<DisputeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/dispute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(disputeData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to raise dispute');
        }

        return data;
    } catch (error) {
        console.error('Error raising dispute:', error);
        throw error;
    }
};

/**
 * Get dispute status for a trade
 * Returns the active or most recent dispute for this trade
 */
export const getTradeDispute = async (tradeId: string): Promise<DisputeResponse> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/dispute`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch dispute');
        }

        return data;
    } catch (error) {
        console.error('Error fetching dispute:', error);
        throw error;
    }
};

/**
 * Add a message to an existing dispute on a trade
 */
export const addDisputeMessage = async (
    tradeId: string,
    messageData: DisputeMessageData
): Promise<{ statusCode: number; message: string; data: DisputeMessage }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/dispute/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(messageData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to add message');
        }

        return data;
    } catch (error) {
        console.error('Error adding dispute message:', error);
        throw error;
    }
};

/**
 * Get all messages for a dispute on a trade
 */
export const getDisputeMessages = async (
    tradeId: string
): Promise<{ statusCode: number; message: string; data: DisputeMessage[] }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/${tradeId}/dispute/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch dispute messages');
        }

        return data;
    } catch (error) {
        console.error('Error fetching dispute messages:', error);
        throw error;
    }
};
