// ============================================
// CURRENCY TYPES
// ============================================

export interface Currency {
  _id: string;
  code: string; // ISO 4217: "USD", "EUR"
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyDto {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces?: number;
  isActive?: boolean;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  symbolPosition?: 'before' | 'after';
  decimalPlaces?: number;
  isActive?: boolean;
}

export interface CurrenciesQueryParams {
  isActive?: boolean;
  search?: string;
}

export interface CurrenciesResponse {
  currencies: Currency[];
  total: number;
}

// ============================================
// COUNTRY TYPES
// ============================================

export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'
  | 'Antarctica';

export interface Country {
  _id: string;
  isoCode: string; // "US", "IN"
  isoCode3: string; // "USA", "IND"
  name: string;
  flagEmoji?: string;
  continent: Continent;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCountryDto {
  isoCode: string;
  isoCode3: string;
  name: string;
  flagEmoji?: string;
  continent: Continent;
  isActive?: boolean;
}

export interface UpdateCountryDto {
  name?: string;
  flagEmoji?: string;
  continent?: Continent;
  isActive?: boolean;
}

export interface CountriesQueryParams {
  isActive?: boolean;
  continent?: Continent;
  search?: string;
}

export interface CountriesResponse {
  countries: Country[];
  total: number;
}

// ============================================
// PORT TYPES
// ============================================

export type PortType = 'sea' | 'air' | 'land';

export interface Port {
  _id: string;
  name: string;
  code: string; // UN/LOCODE: "USNYC"
  country: string | Country; // ObjectId or populated
  type: PortType;
  city?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortDto {
  name: string;
  code: string;
  country: string;
  type: PortType;
  city?: string;
  isActive?: boolean;
}

export interface UpdatePortDto {
  name?: string;
  code?: string;
  country?: string;
  type?: PortType;
  city?: string;
  isActive?: boolean;
}

export interface PortsQueryParams {
  isActive?: boolean;
  country?: string;
  type?: PortType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PortsResponse {
  ports: Port[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ============================================
// PRODUCT CATEGORY TYPES
// ============================================

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | ProductCategory; // ObjectId or populated
  level: number; // 0, 1, 2 (max 3 levels)
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  children?: ProductCategory[]; // For tree structure
  // Mainstream/Niche classification fields
  isMainstream?: boolean | null; // null = parent category, true/false = leaf classification
  aliases?: string[];
  hsCodePrefix?: string;
  createdByUser?: string | { firstName: string; lastName: string; email: string };
  path?: string; // Category path for display (e.g., "Agricultural > Grains > Wheat")
}

export interface CreateCategoryDto {
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  parent?: string;
  isActive?: boolean;
  // Mainstream/Niche classification fields
  isMainstream?: boolean | null;
  aliases?: string[];
  hsCodePrefix?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parent?: string;
  order?: number;
  isActive?: boolean;
  // Mainstream/Niche classification fields
  isMainstream?: boolean | null;
  aliases?: string[];
  hsCodePrefix?: string;
}

export interface CategoriesQueryParams {
  isActive?: boolean;
  parent?: string | null; // null = root categories
  includeDeleted?: boolean;
  search?: string;
  // Mainstream/Niche classification filters
  isMainstream?: boolean;
  leafOnly?: boolean;
  pendingOnly?: boolean;
}

export interface CategoriesResponse {
  categories: ProductCategory[];
  total: number;
}

export interface CategoryTreeResponse {
  tree: ProductCategory[];
  total: number;
}

export interface ReorderCategoriesDto {
  categoryId: string;
  newOrder: number;
  newParent?: string | null;
}

// ============================================
// HSN CODE TYPES
// ============================================

export interface HSNCode {
  _id: string;
  code: string; // "0101", "010121"
  description: string;
  category?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHSNCodeDto {
  code: string;
  description: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateHSNCodeDto {
  description?: string;
  category?: string;
  isActive?: boolean;
}

export interface HSNCodesQueryParams {
  isActive?: boolean;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface HSNCodesResponse {
  hsnCodes: HSNCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

// ============================================
// INCOTERM TYPES
// ============================================

export type IncotermCode =
  | 'EXW'
  | 'FCA'
  | 'FAS'
  | 'FOB'
  | 'CFR'
  | 'CIF'
  | 'CPT'
  | 'CIP'
  | 'DAP'
  | 'DPU'
  | 'DDP';

export type TransportMode = 'any' | 'sea_inland';

export type CostParty = 'Buyer' | 'Seller';

export interface CostAllocation {
  commercialInvoice: CostParty;
  packagingQualityControl: CostParty;
  loadingInlandDelivery: CostParty;
  exportDutyTaxes: CostParty;
  originTerminalHandling: CostParty;
  insurance: CostParty;
  carriageCharges: CostParty;
  destinationTerminalHandling: CostParty;
  deliveryToDestination: CostParty;
  unloadingAtDestination: CostParty;
  importDutyTaxes: CostParty;
}

export interface Incoterm {
  _id: string;
  code: IncotermCode;
  name: string;
  description: string;
  riskTransferDescription?: string;
  transportMode: TransportMode;
  costAllocation: CostAllocation;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateIncotermDto {
  name?: string;
  description?: string;
  riskTransferDescription?: string;
  transportMode?: TransportMode;
  costAllocation?: Partial<CostAllocation>;
}

export interface IncotermsQueryParams {
  transportMode?: TransportMode;
}

export interface IncotermsResponse {
  incoterms: Incoterm[];
  total: number;
}

// ============================================
// COMMON TYPES
// ============================================

export interface SeedResult {
  created: number;
  skipped: number;
  total: number;
}

export interface ContentStats {
  currencies: { total: number; active: number };
  countries: { total: number; active: number };
  ports: { total: number; active: number };
  categories: { total: number; active: number };
  hsnCodes: { total: number; active: number };
  incoterms: { total: number };
  commodities: { total: number; mainstream: number; niche: number };
  units: { total: number; active: number };
}

// ============================================
// COMMODITY TYPES
// ============================================

export const COMMODITY_PARENT_CATEGORIES = [
  'Agricultural',
  'Livestock & Animal Products',
  'Energy',
  'Metals',
  'Construction & Industrial',
  'Non-metallic Minerals',
  'Energy Transition & Strategic',
  'Environmental & Carbon',
] as const;

export type CommodityParentCategory = (typeof COMMODITY_PARENT_CATEGORIES)[number];

export interface Commodity {
  _id: string;
  name: string;
  slug: string;
  category: string;
  parentCategory: CommodityParentCategory;
  subCategory?: string;
  hsCodePrefix?: string;
  isMainstream: boolean;
  aliases: string[];
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommodityDto {
  name: string;
  slug?: string;
  category: string;
  parentCategory: CommodityParentCategory;
  subCategory?: string;
  hsCodePrefix?: string;
  isMainstream: boolean;
  aliases?: string[];
  isActive?: boolean;
  description?: string;
}

export interface UpdateCommodityDto {
  name?: string;
  category?: string;
  parentCategory?: CommodityParentCategory;
  subCategory?: string;
  hsCodePrefix?: string;
  isMainstream?: boolean;
  aliases?: string[];
  isActive?: boolean;
  description?: string;
}

export interface CommoditiesQueryParams {
  isActive?: boolean;
  isMainstream?: boolean;
  parentCategory?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CommoditiesResponse {
  commodities: Commodity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommodityStats {
  total: number;
  mainstream: number;
  niche: number;
  active: number;
  inactive: number;
  byCategory: Array<{
    _id: string;
    count: number;
    mainstream: number;
    niche: number;
  }>;
}

// ============================================
// UNIT TYPES
// ============================================

export const UNIT_TYPES = ['weight', 'volume', 'count', 'length', 'area'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export interface Unit {
  _id: string;
  code: string;
  name: string;
  pluralName: string;
  symbol: string;
  type: UnitType;
  baseUnit?: string;
  conversionFactor?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitDto {
  code: string;
  name: string;
  pluralName: string;
  symbol: string;
  type: UnitType;
  baseUnit?: string;
  conversionFactor?: number;
  isActive?: boolean;
}

export interface UpdateUnitDto {
  name?: string;
  pluralName?: string;
  symbol?: string;
  type?: UnitType;
  baseUnit?: string;
  conversionFactor?: number;
  isActive?: boolean;
}

export interface UnitsQueryParams {
  isActive?: boolean;
  type?: UnitType;
  search?: string;
}

export interface UnitsResponse {
  units: Unit[];
  total: number;
}

export interface UnitStats {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{
    _id: UnitType;
    count: number;
    active: number;
  }>;
}
