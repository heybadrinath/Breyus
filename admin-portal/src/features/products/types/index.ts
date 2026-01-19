export interface Product {
  _id: string
  name: string
  stock: string
  stockUnit: string
  moq: string
  moqUnit: string
  description: string
  detailedDescription: string
  application?: string
  environmentalImpact?: string
  qualityAssurance?: string
  category: string
  hsnCode: string
  price: string
  currency: string
  sku: string
  isActive: boolean
  onSale: boolean
  discount?: string
  salePrice?: string
  costOfGoods?: string
  profit?: string
  pricing?: string
  margin?: string
  tags: string[]
  exportLocation?: string
  nearestPort?: string
  revenueMin?: string
  revenueMax?: string
  currencyTrade?: string
  unitTrade?: string
  paymentTerms?: string
  logisticsTerms?: string
  popTerms?: string
  yearsTrade?: string
  industry?: string
  marketYears?: string
  sellerMarketYears?: string
  marketcapture?: string
  selectedIncoterm?: string
  selectedIncotermData?: Record<string, string>
  defaults?: Record<string, Record<string, string>>
  productImages: string[]
  testReports: string[]
  userId: string
  commodityId?: string
  isNicheCommodity: boolean
  // Admin moderation fields
  isDeactivated: boolean
  deactivatedAt?: string
  deactivatedBy?: string
  deactivationReason?: string
  isFeatured: boolean
  featuredAt?: string
  featuredBy?: string
  createdAt: string
  updatedAt: string
}

export interface ProductsQueryParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  sellerId?: string
  isActive?: boolean
  isDeactivated?: boolean
  isFeatured?: boolean
  startDate?: string
  endDate?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductStats {
  total: number
  active: number
  deactivated: number
  featured: number
  niche: number
  recentlyAdded: number
  byCategory: { category: string; count: number }[]
}

export interface DeactivateProductDto {
  reason: string
}
