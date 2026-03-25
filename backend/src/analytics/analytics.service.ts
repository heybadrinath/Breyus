/**
 * Analytics Service
 *
 * Provides analytics data for seller dashboards including:
 * - Metrics (visits, sales, revenue, customers)
 * - Bar graph data (store visits over time)
 * - Scatter graph data (revenue trends)
 * - Pie chart data (customer distribution)
 * - Country sales data (sales by delivery destination)
 * - Sales metrics (comprehensive sales data)
 * - Top products (for radar chart)
 * - Time series data (for line/area charts)
 *
 * Includes Redis caching with 15-minute TTL for performance.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade } from '../trade/schema/trade.schema';
import { Product } from '../products/schema/products.schema';
import { Company } from '../company/company.schema';
import { User } from '../users/user.schema';
import { CacheService } from '../common/cache/cache.service';
import { getPreviousPeriodRange } from './dto/analytics-query.dto';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BarGraphData {
  date: string;
  storeVisits: number;
}

export interface ScatterGraphData {
  x: number;
  y: number;
  date: string; // Human-readable date label for X-axis
}

export interface PieChartData {
  category: string;
  value: number;
}

export interface CountrySalesData {
  country: string;
  flag: string;
  sales: number;
  value: string;
  percentage: string;
}

export interface MetricsComparison {
  visitsChange: number;
  salesChange: number;
  revenueChange: number;
  customersChange: number;
}

export interface MetricsData {
  totalVisits: number;
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  currency: string; // ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
  comparison: MetricsComparison;
}

// New interfaces for Sales page
export interface SalesMetricsComparison {
  salesChange: number;
  volumeChange: number;
  revenueChange: number;
  averageOrderChange: number;
  customersChange: number;
}

export interface SalesMetricsData {
  totalSales: number;
  totalVolume: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  currency: string;
  comparison: SalesMetricsComparison;
}

export interface TopProductData {
  productName: string;
  productId: string;
  tradeCount: number;
  totalValue: number;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  volume: number;
}

// ============================================================================
// COUNTRY FLAGS MAPPING
// ============================================================================

const countryFlags: { [key: string]: string } = {
  india: 'https://flagcdn.com/w40/in.png',
  'united states': 'https://flagcdn.com/w40/us.png',
  usa: 'https://flagcdn.com/w40/us.png',
  'united kingdom': 'https://flagcdn.com/w40/gb.png',
  uk: 'https://flagcdn.com/w40/gb.png',
  germany: 'https://flagcdn.com/w40/de.png',
  france: 'https://flagcdn.com/w40/fr.png',
  china: 'https://flagcdn.com/w40/cn.png',
  japan: 'https://flagcdn.com/w40/jp.png',
  canada: 'https://flagcdn.com/w40/ca.png',
  australia: 'https://flagcdn.com/w40/au.png',
  brazil: 'https://flagcdn.com/w40/br.png',
  mexico: 'https://flagcdn.com/w40/mx.png',
  singapore: 'https://flagcdn.com/w40/sg.png',
  uae: 'https://flagcdn.com/w40/ae.png',
  'united arab emirates': 'https://flagcdn.com/w40/ae.png',
  'south korea': 'https://flagcdn.com/w40/kr.png',
  netherlands: 'https://flagcdn.com/w40/nl.png',
  italy: 'https://flagcdn.com/w40/it.png',
  spain: 'https://flagcdn.com/w40/es.png',
  russia: 'https://flagcdn.com/w40/ru.png',
  thailand: 'https://flagcdn.com/w40/th.png',
  chile: 'https://flagcdn.com/w40/cl.png',
  argentina: 'https://flagcdn.com/w40/ar.png',
  england: 'https://flagcdn.com/w40/gb.png',
};

// Cache TTL in seconds (1 minute for faster refresh during development)
const CACHE_TTL = 60;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cacheService: CacheService,
  ) {}

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  private getFlagUrl(country: string): string {
    const normalizedCountry = country?.toLowerCase().trim() || '';
    return countryFlags[normalizedCountry] || 'https://flagcdn.com/w40/un.png';
  }

  /**
   * Infer currency from company's country if not explicitly set
   * Falls back to USD if country not recognized
   */
  private inferCurrencyFromCountry(country: string | undefined): string {
    if (!country) return 'USD';

    const normalizedCountry = country.toLowerCase().trim();
    const countryCurrencyMap: { [key: string]: string } = {
      india: 'INR',
      'united states': 'USD',
      usa: 'USD',
      'united kingdom': 'GBP',
      uk: 'GBP',
      england: 'GBP',
      germany: 'EUR',
      france: 'EUR',
      italy: 'EUR',
      spain: 'EUR',
      netherlands: 'EUR',
      japan: 'JPY',
      china: 'CNY',
      australia: 'AUD',
      canada: 'CAD',
      singapore: 'SGD',
      uae: 'AED',
      'united arab emirates': 'AED',
      brazil: 'BRL',
      russia: 'RUB',
      'south korea': 'KRW',
      mexico: 'MXN',
      thailand: 'THB',
      chile: 'CLP',
      argentina: 'ARS',
    };

    return countryCurrencyMap[normalizedCountry] || 'USD';
  }

  /**
   * Get company currency - uses explicit currency if set, otherwise infers from country
   */
  private async getCompanyCurrency(companyId: string): Promise<string> {
    const company = await this.companyModel
      .findById(companyId)
      .select('currency country')
      .lean();
    if (!company) return 'USD';

    // If currency is explicitly set and not 'USD' (the default), use it
    const explicitCurrency = (company as any)?.currency;
    if (explicitCurrency && explicitCurrency !== 'USD') {
      return explicitCurrency;
    }

    // Otherwise infer from country
    const country = (company as any)?.country;
    return this.inferCurrencyFromCountry(country);
  }

  /**
   * Get currency symbol for display
   */
  private getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: '$',
      INR: '₹',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      SGD: 'S$',
      AED: 'د.إ',
      BRL: 'R$',
      RUB: '₽',
      KRW: '₩',
      MXN: '$',
      THB: '฿',
      CLP: '$',
      ARS: '$',
    };
    return symbols[currency] || '$';
  }

  /**
   * Get product IDs for a company
   * Uses a multi-step fallback approach:
   * 1. Try using company.users array
   * 2. Fallback: Query Users table directly to find users with this company
   * 3. Find products where userId matches any of these user IDs
   */
  private async getProductIdsForCompany(
    companyId: string,
  ): Promise<Types.ObjectId[]> {
    this.logger.debug(
      `getProductIdsForCompany: Starting lookup for company ${companyId}`,
    );

    let userIds: string[] = [];

    // Step 1: Try getting users from company.users array
    const company = await this.companyModel
      .findById(companyId)
      .select('users')
      .lean();
    if (company?.users && company.users.length > 0) {
      userIds = company.users.map((u) => u.toString());
      this.logger.debug(
        `getProductIdsForCompany: Found ${userIds.length} users from company.users array`,
      );
    }

    // Step 2: Fallback - Query Users table directly (in case company.users is empty/outdated)
    if (userIds.length === 0) {
      this.logger.debug(
        'getProductIdsForCompany: company.users empty, querying Users table directly',
      );
      const users = await this.userModel
        .find({
          company: new Types.ObjectId(companyId),
        })
        .select('_id')
        .lean();

      userIds = users.map((u) => u._id.toString());
      this.logger.debug(
        `getProductIdsForCompany: Found ${userIds.length} users from Users table`,
      );
    }

    // Step 3: Find products for these users
    // Product.userId is a string containing the user's _id
    const products = await this.productModel
      .find({
        $or: [
          { userId: { $in: userIds } }, // Products owned by company users
          { userId: companyId }, // Legacy: userId might be companyId directly
        ],
        isActive: { $ne: false }, // Only active products
        isDeactivated: { $ne: true }, // Not admin-deactivated
      })
      .select('_id userId')
      .lean();

    this.logger.debug(
      `getProductIdsForCompany: Found ${products.length} products for company ${companyId}`,
    );

    if (products.length === 0) {
      this.logger.warn(
        `getProductIdsForCompany: No products found for company ${companyId}. User IDs searched: ${userIds.join(', ')}`,
      );
    }

    return products.map((p) => p._id as Types.ObjectId);
  }

  private async getMetricsForPeriod(
    productIds: Types.ObjectId[],
    startDate: Date,
    endDate: Date,
  ): Promise<{
    visits: number;
    sales: number;
    revenue: number;
    customers: number;
  }> {
    if (productIds.length === 0) {
      this.logger.debug('getMetricsForPeriod: No products to analyze');
      return { visits: 0, sales: 0, revenue: 0, customers: 0 };
    }

    const dateFilter = {
      product: { $in: productIds },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Count completed trades
    const completedTrades = await this.tradeModel.countDocuments({
      ...dateFilter,
      tradePhase: 'COMPLETED',
    });

    // Calculate revenue from completed trades
    const trades = await this.tradeModel
      .find({
        ...dateFilter,
        tradePhase: 'COMPLETED',
      })
      .lean();

    let totalRevenue = 0;
    for (const trade of trades) {
      const price =
        parseFloat(
          trade.buyerOfferedPrice?.toString() ||
            trade.sellerOfferedPrice?.toString() ||
            '0',
        ) || 0;
      const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
      totalRevenue += price * quantity;
    }

    // Get unique buyers (customers) in this period
    const uniqueBuyers = await this.tradeModel.distinct('buyer', dateFilter);

    // FIX: Get REAL product views instead of fake calculation (was: totalTrades * 5)
    const realViews = await this.getActualProductViews(
      productIds,
      startDate,
      endDate,
    );

    this.logger.debug(
      `getMetricsForPeriod: visits=${realViews}, sales=${completedTrades}, revenue=${Math.round(totalRevenue)}, customers=${uniqueBuyers.length}`,
    );

    return {
      visits: realViews,
      sales: completedTrades,
      revenue: Math.round(totalRevenue),
      customers: uniqueBuyers.length,
    };
  }

  /**
   * Get actual product views from the dailyViews array in Product schema
   * This replaces the fake calculation (totalTrades * 5)
   */
  private async getActualProductViews(
    productIds: Types.ObjectId[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const products = await this.productModel
        .find({
          _id: { $in: productIds },
        })
        .select('dailyViews viewCount')
        .lean();

      let totalViews = 0;
      for (const product of products) {
        if (product.dailyViews && Array.isArray(product.dailyViews)) {
          for (const view of product.dailyViews as {
            date: Date;
            count: number;
          }[]) {
            const viewDate = new Date(view.date);
            if (viewDate >= startDate && viewDate <= endDate) {
              totalViews += view.count;
            }
          }
        }
      }

      this.logger.debug(
        `getActualProductViews: Found ${totalViews} real views for ${products.length} products`,
      );
      return totalViews;
    } catch (error) {
      this.logger.error('Error getting actual product views:', error);
      return 0;
    }
  }

  // ========================================================================
  // EXISTING ENDPOINTS (Dashboard)
  // ========================================================================

  async getMetricsData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<MetricsData> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'metrics',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          this.logger.debug(
            `getMetricsData: Analytics request for company: ${companyId}`,
          );
          this.logger.debug(
            `getMetricsData: Date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`,
          );

          // Get company currency (inferred from country if not explicitly set)
          const currency = await this.getCompanyCurrency(companyId);

          const productIds = await this.getProductIdsForCompany(companyId);
          this.logger.debug(
            `getMetricsData: Found ${productIds.length} products`,
          );

          const current = await this.getMetricsForPeriod(
            productIds,
            dateRange.startDate,
            dateRange.endDate,
          );

          const { prevStartDate, prevEndDate } = getPreviousPeriodRange(
            dateRange.startDate,
            dateRange.endDate,
          );
          const previous = await this.getMetricsForPeriod(
            productIds,
            prevStartDate,
            prevEndDate,
          );

          const comparison: MetricsComparison = {
            visitsChange: this.calculatePercentageChange(
              current.visits,
              previous.visits,
            ),
            salesChange: this.calculatePercentageChange(
              current.sales,
              previous.sales,
            ),
            revenueChange: this.calculatePercentageChange(
              current.revenue,
              previous.revenue,
            ),
            customersChange: this.calculatePercentageChange(
              current.customers,
              previous.customers,
            ),
          };

          this.logger.debug(
            `getMetricsData: Metrics - visits=${current.visits}, sales=${current.sales}, revenue=${current.revenue}, customers=${current.customers}`,
          );

          return {
            totalVisits: current.visits,
            totalSales: current.sales,
            totalRevenue: current.revenue,
            totalCustomers: current.customers,
            currency,
            comparison,
          };
        } catch (error) {
          this.logger.error('Error fetching metrics:', error);
          return {
            totalVisits: 0,
            totalSales: 0,
            totalRevenue: 0,
            totalCustomers: 0,
            currency: 'USD',
            comparison: {
              visitsChange: 0,
              salesChange: 0,
              revenueChange: 0,
              customersChange: 0,
            },
          };
        }
      },
      CACHE_TTL,
    );
  }

  async getBarGraphData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<BarGraphData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'bar-data',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            this.logger.debug('getBarGraphData: No products found for company');
            return [];
          }

          // FIX: Get REAL daily views from products instead of fake calculation (was: trades * 3)
          const products = await this.productModel
            .find({
              _id: { $in: productIds },
            })
            .select('dailyViews')
            .lean();

          const daysDiff = Math.ceil(
            (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          const dataByDate: { [key: string]: number } = {};
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          // Build date label mapping
          const dateLabelMap: { [dateStr: string]: string } = {};

          if (daysDiff <= 7) {
            // Use day names for short periods
            for (let i = daysDiff - 1; i >= 0; i--) {
              const date = new Date(dateRange.endDate);
              date.setDate(date.getDate() - i);
              const dayName = days[date.getDay()];
              dataByDate[dayName] = 0;
              // Map YYYY-MM-DD to day name
              const dateStr = date.toISOString().split('T')[0];
              dateLabelMap[dateStr] = dayName;
            }
          } else {
            // Use date buckets for longer periods
            const numBuckets = Math.min(daysDiff, 12);
            const bucketSize = Math.ceil(daysDiff / numBuckets);

            for (let i = 0; i < numBuckets; i++) {
              const bucketStart = new Date(dateRange.startDate);
              bucketStart.setDate(bucketStart.getDate() + i * bucketSize);
              const label = bucketStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              dataByDate[label] = 0;

              // Map all dates in this bucket to this label
              for (let j = 0; j < bucketSize; j++) {
                const bucketDate = new Date(bucketStart);
                bucketDate.setDate(bucketDate.getDate() + j);
                const dateStr = bucketDate.toISOString().split('T')[0];
                dateLabelMap[dateStr] = label;
              }
            }
          }

          // Aggregate REAL views from products' dailyViews
          for (const product of products) {
            if (product.dailyViews && Array.isArray(product.dailyViews)) {
              for (const view of product.dailyViews as {
                date: Date;
                count: number;
              }[]) {
                const viewDate = new Date(view.date);
                if (
                  viewDate >= dateRange.startDate &&
                  viewDate <= dateRange.endDate
                ) {
                  const dateStr = viewDate.toISOString().split('T')[0];
                  const label = dateLabelMap[dateStr];
                  if (label && dataByDate[label] !== undefined) {
                    dataByDate[label] += view.count;
                  }
                }
              }
            }
          }

          this.logger.debug(
            `getBarGraphData: Generated ${Object.keys(dataByDate).length} data points with real views`,
          );

          return Object.entries(dataByDate).map(([date, storeVisits]) => ({
            date,
            storeVisits, // FIX: Use real views, not multiplied by 3
          }));
        } catch (error) {
          this.logger.error('Error fetching bar graph data:', error);
          return [];
        }
      },
      CACHE_TTL,
    );
  }

  async getScatterGraphData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<ScatterGraphData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'scatter-data',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            return [];
          }

          const trades = await this.tradeModel
            .find({
              product: { $in: productIds },
              createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            })
            .lean();

          const daysDiff = Math.ceil(
            (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          // Use date-based buckets for clearer labels
          const numBuckets = Math.min(daysDiff, 12);
          const bucketSize = Math.ceil(daysDiff / numBuckets);
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          // Create buckets with date labels
          const buckets: {
            x: number;
            y: number;
            date: string;
            bucketStart: Date;
          }[] = [];

          for (let i = 0; i < numBuckets; i++) {
            const bucketStart = new Date(dateRange.startDate);
            bucketStart.setDate(bucketStart.getDate() + i * bucketSize);

            let label: string;
            if (daysDiff <= 7) {
              label = days[bucketStart.getDay()];
            } else {
              label = bucketStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }

            buckets.push({
              x: i + 1,
              y: 0,
              date: label,
              bucketStart,
            });
          }

          // Aggregate trade revenue into buckets
          for (const trade of trades) {
            const tradeDate = new Date(trade.createdAt);
            const daysSinceStart = Math.floor(
              (tradeDate.getTime() - dateRange.startDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const bucketIndex = Math.min(
              Math.floor(daysSinceStart / bucketSize),
              numBuckets - 1,
            );

            if (buckets[bucketIndex]) {
              const price =
                parseFloat(
                  trade.buyerOfferedPrice?.toString() ||
                    trade.sellerOfferedPrice?.toString() ||
                    '0',
                ) || 0;
              const quantity =
                parseFloat(trade.quantity?.toString() || '1') || 1;
              buckets[bucketIndex].y += price * quantity;
            }
          }

          // Return without internal bucketStart field
          return buckets.map((b) => ({
            x: b.x,
            y: Math.round(b.y),
            date: b.date,
          }));
        } catch (error) {
          this.logger.error('Error fetching scatter graph data:', error);
          return [];
        }
      },
      CACHE_TTL,
    );
  }

  async getPieChartData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<PieChartData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'pie-data',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            return [
              { category: 'New Customers', value: 1 },
              { category: 'Returning', value: 1 },
            ];
          }

          const trades = await this.tradeModel
            .find({
              product: { $in: productIds },
              createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            })
            .lean();

          let newCustomers = 0;
          let returningCustomers = 0;

          const buyerCounts: { [key: string]: number } = {};
          for (const trade of trades) {
            const buyerId = trade.buyer?.toString();
            if (buyerId) {
              buyerCounts[buyerId] = (buyerCounts[buyerId] || 0) + 1;
            }
          }

          for (const count of Object.values(buyerCounts)) {
            if (count === 1) {
              newCustomers++;
            } else {
              returningCustomers++;
            }
          }

          return [
            { category: 'New Customers', value: newCustomers || 1 },
            { category: 'Returning', value: returningCustomers || 1 },
          ];
        } catch (error) {
          this.logger.error('Error fetching pie chart data:', error);
          return [
            { category: 'New Customers', value: 1 },
            { category: 'Returning', value: 1 },
          ];
        }
      },
      CACHE_TTL,
    );
  }

  /**
   * Get country sales data
   * FIX: Uses selectedAddress.country (delivery destination) instead of buyer's company address
   */
  async getCountrySalesData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<CountrySalesData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'country-sales',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            return [];
          }

          const trades = await this.tradeModel
            .find({
              product: { $in: productIds },
              createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            })
            .lean();

          if (trades.length === 0) {
            return [];
          }

          // Get company currency (inferred from country if not explicitly set)
          const currency = await this.getCompanyCurrency(companyId);
          const currencySymbol = this.getCurrencySymbol(currency);

          // Aggregate by delivery destination country (from selectedAddress)
          const countryData: {
            [country: string]: { sales: number; value: number };
          } = {};

          for (const trade of trades) {
            // FIX: Use the trade's selectedAddress.country (delivery destination)
            const country =
              (trade as any).selectedAddress?.country || 'Unknown';
            const price =
              parseFloat(
                trade.buyerOfferedPrice?.toString() ||
                  trade.sellerOfferedPrice?.toString() ||
                  '0',
              ) || 0;
            const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;

            if (!countryData[country]) {
              countryData[country] = { sales: 0, value: 0 };
            }
            countryData[country].sales += 1;
            countryData[country].value += price * quantity;
          }

          const totalSales = Object.values(countryData).reduce(
            (sum, d) => sum + d.sales,
            0,
          );

          const result: CountrySalesData[] = Object.entries(countryData)
            .map(([country, data]) => ({
              country: country.charAt(0).toUpperCase() + country.slice(1),
              flag: this.getFlagUrl(country),
              sales: data.sales,
              value: `${currencySymbol}${Math.round(data.value).toLocaleString()}`,
              percentage: `${((data.sales / totalSales) * 100).toFixed(1)}%`,
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 10);

          return result;
        } catch (error) {
          this.logger.error('Error fetching country sales data:', error);
          return [];
        }
      },
      CACHE_TTL,
    );
  }

  // ========================================================================
  // NEW ENDPOINTS (Sales Page)
  // ========================================================================

  /**
   * Get comprehensive sales metrics for the Sales page
   */
  async getSalesMetricsData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<SalesMetricsData> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'sales-metrics',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          // Get company currency (inferred from country if not explicitly set)
          const currency = await this.getCompanyCurrency(companyId);

          if (productIds.length === 0) {
            return this.getEmptySalesMetrics(currency);
          }

          // Get current period data
          const current = await this.getSalesMetricsForPeriod(
            productIds,
            dateRange.startDate,
            dateRange.endDate,
          );

          // Get previous period data for comparison
          const { prevStartDate, prevEndDate } = getPreviousPeriodRange(
            dateRange.startDate,
            dateRange.endDate,
          );
          const previous = await this.getSalesMetricsForPeriod(
            productIds,
            prevStartDate,
            prevEndDate,
          );

          return {
            totalSales: current.totalSales,
            totalVolume: current.totalVolume,
            totalRevenue: current.totalRevenue,
            averageOrderValue: current.averageOrderValue,
            totalCustomers: current.totalCustomers,
            newCustomers: current.newCustomers,
            returningCustomers: current.returningCustomers,
            currency,
            comparison: {
              salesChange: this.calculatePercentageChange(
                current.totalSales,
                previous.totalSales,
              ),
              volumeChange: this.calculatePercentageChange(
                current.totalVolume,
                previous.totalVolume,
              ),
              revenueChange: this.calculatePercentageChange(
                current.totalRevenue,
                previous.totalRevenue,
              ),
              averageOrderChange: this.calculatePercentageChange(
                current.averageOrderValue,
                previous.averageOrderValue,
              ),
              customersChange: this.calculatePercentageChange(
                current.totalCustomers,
                previous.totalCustomers,
              ),
            },
          };
        } catch (error) {
          this.logger.error('Error fetching sales metrics:', error);
          return this.getEmptySalesMetrics('USD');
        }
      },
      CACHE_TTL,
    );
  }

  private async getSalesMetricsForPeriod(
    productIds: Types.ObjectId[],
    startDate: Date,
    endDate: Date,
  ): Promise<Omit<SalesMetricsData, 'currency' | 'comparison'>> {
    const dateFilter = {
      product: { $in: productIds },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Get all trades in period
    const allTrades = await this.tradeModel.find(dateFilter).lean();

    // Get completed trades
    const completedTrades = allTrades.filter(
      (t) => t.tradePhase === 'COMPLETED',
    );

    // Calculate metrics
    let totalVolume = 0;
    let totalRevenue = 0;

    for (const trade of completedTrades) {
      const price =
        parseFloat(
          trade.buyerOfferedPrice?.toString() ||
            trade.sellerOfferedPrice?.toString() ||
            '0',
        ) || 0;
      const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
      totalVolume += quantity;
      totalRevenue += price * quantity;
    }

    const totalSales = completedTrades.length;
    const averageOrderValue =
      totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    // Get unique buyers
    const buyerCounts: { [key: string]: number } = {};
    for (const trade of allTrades) {
      const buyerId = trade.buyer?.toString();
      if (buyerId) {
        buyerCounts[buyerId] = (buyerCounts[buyerId] || 0) + 1;
      }
    }

    let newCustomers = 0;
    let returningCustomers = 0;
    for (const count of Object.values(buyerCounts)) {
      if (count === 1) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    }

    return {
      totalSales,
      totalVolume: Math.round(totalVolume),
      totalRevenue: Math.round(totalRevenue),
      averageOrderValue,
      totalCustomers: Object.keys(buyerCounts).length,
      newCustomers,
      returningCustomers,
    };
  }

  private getEmptySalesMetrics(currency: string): SalesMetricsData {
    return {
      totalSales: 0,
      totalVolume: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      currency,
      comparison: {
        salesChange: 0,
        volumeChange: 0,
        revenueChange: 0,
        averageOrderChange: 0,
        customersChange: 0,
      },
    };
  }

  /**
   * Get top products by trade count/value for radar chart
   */
  async getTopProductsData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<TopProductData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'top-products',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            return [];
          }

          // Get trades grouped by product
          const trades = await this.tradeModel
            .find({
              product: { $in: productIds },
              createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
              tradePhase: 'COMPLETED',
            })
            .lean();

          // Aggregate by product
          const productStats: {
            [productId: string]: { count: number; value: number };
          } = {};

          for (const trade of trades) {
            const productId = trade.product?.toString();
            if (!productId) continue;

            if (!productStats[productId]) {
              productStats[productId] = { count: 0, value: 0 };
            }

            const price =
              parseFloat(
                trade.buyerOfferedPrice?.toString() ||
                  trade.sellerOfferedPrice?.toString() ||
                  '0',
              ) || 0;
            const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;

            productStats[productId].count += 1;
            productStats[productId].value += price * quantity;
          }

          // Get product names
          const productIdList = Object.keys(productStats);
          const products = await this.productModel
            .find({
              _id: { $in: productIdList.map((id) => new Types.ObjectId(id)) },
            })
            .select('_id name')
            .lean();

          const productNameMap: { [id: string]: string } = {};
          for (const product of products) {
            productNameMap[product._id.toString()] = product.name;
          }

          // Build result
          const result: TopProductData[] = Object.entries(productStats)
            .map(([productId, stats]) => ({
              productName: productNameMap[productId] || 'Unknown Product',
              productId,
              tradeCount: stats.count,
              totalValue: Math.round(stats.value),
            }))
            .sort((a, b) => b.tradeCount - a.tradeCount)
            .slice(0, 6); // Top 6 for radar chart

          return result;
        } catch (error) {
          this.logger.error('Error fetching top products:', error);
          return [];
        }
      },
      CACHE_TTL,
    );
  }

  /**
   * Get time series data for line/area charts
   */
  async getTimeSeriesData(
    companyId: string,
    dateRange: DateRange,
  ): Promise<TimeSeriesData[]> {
    const cacheKey = this.cacheService.generateAnalyticsKey(
      companyId,
      'time-series',
      `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const productIds = await this.getProductIdsForCompany(companyId);

          if (productIds.length === 0) {
            return [];
          }

          const trades = await this.tradeModel
            .find({
              product: { $in: productIds },
              createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
              tradePhase: 'COMPLETED',
            })
            .lean();

          const daysDiff = Math.ceil(
            (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          // Determine number of data points and bucket size
          const numBuckets = Math.min(daysDiff, 12);
          const bucketSize = Math.ceil(daysDiff / numBuckets);

          // Initialize buckets
          const buckets: {
            [label: string]: { revenue: number; volume: number };
          } = {};
          const bucketLabels: string[] = [];

          for (let i = 0; i < numBuckets; i++) {
            const bucketStart = new Date(dateRange.startDate);
            bucketStart.setDate(bucketStart.getDate() + i * bucketSize);

            let label: string;
            if (daysDiff <= 7) {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              label = days[bucketStart.getDay()];
            } else {
              label = bucketStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }

            bucketLabels.push(label);
            buckets[label] = { revenue: 0, volume: 0 };
          }

          // Aggregate trades into buckets
          for (const trade of trades) {
            const tradeDate = new Date(trade.createdAt);
            const daysSinceStart = Math.floor(
              (tradeDate.getTime() - dateRange.startDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const bucketIndex = Math.min(
              Math.floor(daysSinceStart / bucketSize),
              numBuckets - 1,
            );
            const label = bucketLabels[bucketIndex];

            if (buckets[label]) {
              const price =
                parseFloat(
                  trade.buyerOfferedPrice?.toString() ||
                    trade.sellerOfferedPrice?.toString() ||
                    '0',
                ) || 0;
              const quantity =
                parseFloat(trade.quantity?.toString() || '1') || 1;

              buckets[label].revenue += price * quantity;
              buckets[label].volume += quantity;
            }
          }

          // Convert to array maintaining order
          return bucketLabels.map((label) => ({
            date: label,
            revenue: Math.round(buckets[label].revenue),
            volume: Math.round(buckets[label].volume),
          }));
        } catch (error) {
          this.logger.error('Error fetching time series data:', error);
          return [];
        }
      },
      CACHE_TTL,
    );
  }

  /**
   * Invalidate cache for a company (call when trades are created/updated)
   */
  async invalidateCompanyCache(companyId: string): Promise<void> {
    await this.cacheService.invalidateCompanyAnalytics(companyId);
  }
}
