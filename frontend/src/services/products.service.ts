const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/products";

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