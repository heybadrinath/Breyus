import axios from 'axios';
import type {
  CommodityPrice,
  CommodityPriceSummary,
  CommodityCategory,
} from '../types/marketplaceTypes';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Commodity Service
 * Handles fetching commodity futures prices for the marketplace widget
 */
class CommodityService {
  /**
   * Get all commodity prices with summary metadata
   */
  async getPriceSummary(): Promise<CommodityPriceSummary> {
    const response = await axios.get<ApiResponse<CommodityPriceSummary>>(
      `${API_URL}/commodities/prices`
    );
    return response.data.data!;
  }

  /**
   * Get single commodity price by symbol
   */
  async getPriceBySymbol(symbol: string): Promise<CommodityPrice | null> {
    const response = await axios.get<ApiResponse<CommodityPrice>>(
      `${API_URL}/commodities/prices/${symbol}`
    );
    return response.data.data || null;
  }

  /**
   * Get commodity prices by category
   */
  async getPricesByCategory(category: CommodityCategory): Promise<CommodityPrice[]> {
    const response = await axios.get<ApiResponse<CommodityPrice[]>>(
      `${API_URL}/commodities/prices/category/${category}`
    );
    return response.data.data || [];
  }
}

export const commodityService = new CommodityService();
export default commodityService;
