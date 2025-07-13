export interface Product {
  id: string;
  name: string;
  moq?: string;
  preciseDescription?: string;
  detailedDescription?: string;
  category?: string;
  hsnCode?: string;
  productImage?: string;
  images?: string[];
  primaryImage?: string;
  testReports?: string;
  price: number;
  sku?: string;
  onSale: boolean;
  discount: number;
  salePrice: number;
  costOfGoods: number;
  profit: number;
  margin: number;
  tags?: string[];
  quantity: number;
  sellerId?: string;
  sellerName?: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  reviewCount?: number;
  description?: string;
  // Trade terms fields
  preferred_buyer_revenue_range?: string;
  potential_years_to_trade?: string;
  industry_using_product?: string;
  years_in_market?: string;
  buyer_market_duration?: string;
  market_capture?: number;
} 