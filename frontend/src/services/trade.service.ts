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

export interface CreateTradeRequest {
    productId: string;
    quantity: string;
    quantityUnit: string;
    buyerOfferedPrice?: string;
    buyerIncoterms?: Incoterms;
    buyerMessage?: string;
    addresses: Address[];
    selectedAddress: Address;
    buyerIndustryType?: string;
    buyerMarketYears: string;
    marketCapture?: string;
    tradeYears: string;
    productUsage?: string;
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
    };
    seller: {
        _id: string;
        mail: string;
    };
    quantity: string;
    quantityUnit: string;
    buyerOfferedPrice?: string;
    buyerIncoterms?: Incoterms;
    buyerMessage?: string;
    addresses: Address[];
    selectedAddress: Address;
    buyerIndustryType?: string;
    buyerMarketYears: string;
    marketCapture?: string;
    tradeYears: string;
    productUsage?: string;
    paymentMethod: PaymentMethod;
    tradeStatus: string;
    createdAt: string;
    updatedAt: string;
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