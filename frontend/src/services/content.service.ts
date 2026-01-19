/**
 * Content Service
 *
 * Centralized service for fetching admin-managed content (categories, units, countries, etc.)
 * from the public content API. These endpoints are unauthenticated and return read-only data.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CONTENT_ENDPOINT = `${BACKEND_URL}/public/content`;

// ============================================================================
// Type Definitions
// ============================================================================

export type UnitType = 'weight' | 'volume' | 'count' | 'length' | 'area';

export interface Unit {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  type: UnitType;
  conversionFactor?: number;
  isBase?: boolean;
  isActive: boolean;
}

export interface UnitsGrouped {
  weight: Unit[];
  volume: Unit[];
  count: Unit[];
  length: Unit[];
  area: Unit[];
}

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica';

export interface Country {
  _id: string;
  code: string;
  name: string;
  continent: Continent;
  currencyCode?: string;
  flag?: string;
  isActive: boolean;
}

export type PortType = 'sea' | 'air' | 'land';

export interface Port {
  _id: string;
  code: string;
  name: string;
  country: string | Country;
  type: PortType;
  city?: string;
  isActive: boolean;
}

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export type IncotermCode = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

export interface Incoterm {
  _id: string;
  code: IncotermCode;
  name: string;
  description: string;
  riskTransferPoint: string;
  costResponsibility: Record<string, 'Buyer' | 'Seller'>;
  applicableModes: string[];
}

export interface CategoryNode {
  _id: string;
  slug: string;
  name: string;
  level: number;
  parentSlug?: string;
  isActive: boolean;
  children?: CategoryNode[];
}

export interface Category {
  _id: string;
  slug: string;
  name: string;
  level: number;
  parentSlug?: string;
  path?: string;
  isActive: boolean;
  // Mainstream/Niche classification fields
  isMainstream?: boolean | null;
  aliases?: string[];
  hsCodePrefix?: string;
  // User-submitted pending category fields
  isPending?: boolean; // true if this is a user-suggested category awaiting admin approval
  createdByUser?: string;
}

export interface GroupedCategories {
  mainstream: Category[];
  niche: Category[];
}

export interface SuggestCategoryDto {
  name: string;
  parentId?: string;
}

// ============================================================================
// Response Types
// ============================================================================

interface ContentResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchContent<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${CONTENT_ENDPOINT}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch content from ${endpoint}`);
  }

  const result: ContentResponse<T> = await response.json();
  return result.data;
}

// ============================================================================
// Category APIs
// ============================================================================

/**
 * Fetch the category tree structure (3-level hierarchy)
 * Used for cascading category selectors
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  return fetchContent<CategoryNode[]>('/categories/tree');
}

/**
 * Fetch flat list of all active categories
 * Used for simple category dropdowns
 */
export async function getCategories(): Promise<Category[]> {
  return fetchContent<Category[]>('/categories');
}

/**
 * Fetch categories grouped by mainstream/niche classification
 * Used for the seller product creation dropdown
 * Includes user's pending (unapproved) categories if authenticated
 */
export async function getCategoriesGrouped(): Promise<GroupedCategories> {
  // Use fetch with credentials to include user's pending categories
  const response = await fetch(`${CONTENT_ENDPOINT}/categories/grouped`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch grouped categories');
  }

  const result: ContentResponse<GroupedCategories> = await response.json();
  return result.data;
}

/**
 * Suggest a new category (for sellers who can't find their commodity)
 * Creates a new category with isActive=false, pending admin approval
 * @param data - The category suggestion data
 * @param authToken - The user's auth token (from cookie or stored)
 */
export async function suggestNewCategory(data: SuggestCategoryDto): Promise<Category> {
  const response = await fetch(`${CONTENT_ENDPOINT}/categories/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send cookies for authentication
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to suggest category');
  }

  const result: ContentResponse<Category> = await response.json();
  return result.data;
}

// ============================================================================
// Units APIs
// ============================================================================

/**
 * Fetch all active units, optionally filtered by type
 * @param type - Optional filter by unit type (weight, volume, count, length, area)
 */
export async function getUnits(type?: UnitType): Promise<Unit[]> {
  const endpoint = type ? `/units?type=${type}` : '/units';
  return fetchContent<Unit[]>(endpoint);
}

/**
 * Fetch all active units grouped by type
 * Useful for displaying units in categorized sections
 */
export async function getUnitsGrouped(): Promise<UnitsGrouped> {
  return fetchContent<UnitsGrouped>('/units/grouped');
}

// ============================================================================
// Countries APIs
// ============================================================================

/**
 * Fetch all active countries, optionally filtered by continent
 * @param continent - Optional filter by continent
 */
export async function getCountries(continent?: Continent): Promise<Country[]> {
  const endpoint = continent ? `/countries?continent=${encodeURIComponent(continent)}` : '/countries';
  return fetchContent<Country[]>(endpoint);
}

// ============================================================================
// Ports APIs
// ============================================================================

/**
 * Fetch all active ports, optionally filtered by country and/or type
 * @param countryId - Optional filter by country ID
 * @param type - Optional filter by port type (sea, air, land)
 */
export async function getPorts(countryId?: string, type?: PortType): Promise<Port[]> {
  const params = new URLSearchParams();
  if (countryId) params.append('country', countryId);
  if (type) params.append('type', type);

  const queryString = params.toString();
  const endpoint = queryString ? `/ports?${queryString}` : '/ports';
  return fetchContent<Port[]>(endpoint);
}

// ============================================================================
// Currencies APIs
// ============================================================================

/**
 * Fetch all active currencies
 */
export async function getCurrencies(): Promise<Currency[]> {
  return fetchContent<Currency[]>('/currencies');
}

// ============================================================================
// Incoterms APIs
// ============================================================================

/**
 * Fetch all incoterms with full details
 */
export async function getIncoterms(): Promise<Incoterm[]> {
  return fetchContent<Incoterm[]>('/incoterms');
}

/**
 * Fetch incoterm codes only (for dropdown display)
 */
export async function getIncotermCodes(): Promise<IncotermCode[]> {
  return fetchContent<IncotermCode[]>('/incoterms/codes');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a unit for display in dropdowns
 * @param unit - The unit object
 * @returns Formatted string like "Kilogram (kg)"
 */
export function formatUnitOption(unit: Unit): string {
  return `${unit.name} (${unit.symbol})`;
}

/**
 * Format a country for display in dropdowns
 * @param country - The country object
 * @returns Formatted string with flag emoji
 */
export function formatCountryOption(country: Country): string {
  const flag = country.flag || '';
  return `${flag} ${country.name}`.trim();
}

/**
 * Get the full category path from a category tree
 * @param tree - The category tree
 * @param slug - The target category slug
 * @returns Array of slugs representing the path, or empty if not found
 */
export function getCategoryPath(tree: CategoryNode[], slug: string): string[] {
  for (const node of tree) {
    if (node.slug === slug) {
      return [node.slug];
    }
    if (node.children) {
      const childPath = getCategoryPath(node.children, slug);
      if (childPath.length > 0) {
        return [node.slug, ...childPath];
      }
    }
  }
  return [];
}

/**
 * Flatten a category tree into a single array
 * @param tree - The category tree
 * @returns Flat array of all categories
 */
export function flattenCategoryTree(tree: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];

  function traverse(nodes: CategoryNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}
