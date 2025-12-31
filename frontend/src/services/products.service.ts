const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/products";

type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
  selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm
  defaults?: Record<IncotermType, IncotermRowData>;  // Default Incoterm values
}

export interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  category: string;
  hsnCode: string;
  price: number;
  currency: string;
  sku: string;
  onSale: boolean;
  discount: number;
  salePrice: number;
  costOfGoods: number;
  profit: number;
  margin: number;
  tags: string[];
  stock: number;
  stockUnit: string;
  productImage: string;
  images: string[];
  primaryImage: string;
  testReport: string;
  createdAt: Date;
  updatedAt: Date;
  moq: number;
  moqUnit: string;
  preciseDescription: string;
  sellerName: string;
  companyName: string;

  // trade terms
  revenueMin: string;
  revenueMax: string;
  currencyTrade: string;
  unitTrade: string;
  yearsTrade: string;
  industry: string;
  marketYears: string;
  sellerMarketYears: string;
  marketcapture: string;

  // incoterms
  selectedIncoterm: IncotermType;
  selectedIncotermData: IncotermRowData;
  defaults: Record<IncotermType, IncotermRowData>;
}

export interface CreateProductData {
  // Product information
  name: string;
  stock: string;
  stockUnit: string;
  moq: string;
  moqUnit: string;
  description: string;
  detailedDescription: string;
  category: string;
  hsnCode: string;

  // Pricing
  price: string;
  currency: string;
  sku: string;
  onSale: boolean;
  discount?: string;
  salePrice?: string;
  costOfGoods?: string;
  profit?: string;
  margin?: string;

  // Tags
  tags: string[];

  // Trade terms
  revenueMin?: string;
  revenueMax?: string;
  currencyTrade?: string;
  unitTrade?: string;
  yearsTrade?: string;
  industry?: string;
  marketYears?: string;
  sellerMarketYears?: string;
  marketcapture?: string;

  // Incoterms
  selectedIncoterm?: string;
  selectedIncotermData?: Record<string, 'Buyer' | 'Seller'>;
}

export interface ProductResponse {
  statusCode: number;
  message: string;
  data: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationResponse {
  statusCode: number;
  message: string;
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface HsnCode {
  code: string;
  description: string;
  category?: string;
}

export interface HsnSearchResponse {
  statusCode: number;
  message: string;
  data: HsnCode[];
}

export const getProductsWithPagination = async (params: PaginationParams): Promise<PaginationResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.category) {
      queryParams.append('category', params.category);
    }
    if (params.minPrice !== undefined) {
      queryParams.append('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== undefined) {
      queryParams.append('maxPrice', params.maxPrice.toString());
    }

    const response = await fetch(`${BACKEND_END_POINT}/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch products');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

export const createProduct = async (productData: CreateProductData, files: File[]): Promise<ProductResponse> => {
  try {
    const formData = new FormData();

    // Add product data as JSON string
    formData.append('productData', JSON.stringify(productData));

    // Add files
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const response = await fetch(`${BACKEND_END_POINT}/add-product`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create product');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

export const getUserProducts = async (): Promise<ProductResponse> => {
  try {
    const response = await fetch(`${BACKEND_END_POINT}/user-products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user products');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

export const getProductById = async (productId: string): Promise<ProductResponse> => {
  try {
    const response = await fetch(`${BACKEND_END_POINT}/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch product');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

export const searchHsnCodes = async (query: string): Promise<HsnSearchResponse> => {
  try {
    const response = await fetch(`${BACKEND_END_POINT}/hsn?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to search HSN codes');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
}; 