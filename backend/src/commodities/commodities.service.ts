import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Commodity Price Types
 */
export type CommodityCategory =
  | 'Energy'
  | 'Metals'
  | 'Agricultural'
  | 'Precious Metals';
export type Exchange =
  | 'CME'
  | 'NYMEX'
  | 'LME'
  | 'COMEX'
  | 'CBOT'
  | 'ICE'
  | 'MCX'
  | 'ALPHA_VANTAGE';

/**
 * Historical price data point for sparklines and charts
 */
export interface PriceHistoryPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
}

export interface CommodityPrice {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  exchange: Exchange;
  category: CommodityCategory;
  unit: string;
  fetchedAt: string;
  delayMinutes: number;
  isActive: boolean;
  // NEW: Historical data for sparklines and charts
  priceHistory: PriceHistoryPoint[]; // Last 7 days for sparkline
  weekHigh: number; // 7-day high
  weekLow: number; // 7-day low
}

export interface CommodityPriceSummary {
  prices: CommodityPrice[];
  lastUpdated: string | null;
  delayMinutes: number;
  totalCount: number;
  nextRefreshAt: string | null; // When the next refresh will be allowed
  refreshIntervalHours: number; // How often data refreshes (12 hours)
  dataSource: string; // "Alpha Vantage" or "Unavailable"
  isLoading: boolean; // Whether a refresh is in progress
}

/**
 * Alpha Vantage commodity configuration
 */
interface CommodityConfig {
  function: string;
  symbol: string;
  name: string;
  category: CommodityCategory;
  unit: string;
}

/**
 * CommoditiesService
 *
 * Fetches real commodity prices from Alpha Vantage API with smart lazy-refresh caching.
 *
 * Rate Limiting Strategy:
 * - Alpha Vantage free tier: 25 requests/day
 * - We fetch 12 commodities per refresh = 12 API calls
 * - Max 2 refreshes per day (25 ÷ 12 ≈ 2)
 * - Minimum interval between refreshes: 12 hours
 *
 * Lazy Refresh Logic:
 * - On user request, check when data was last updated
 * - If data > 24 hours old: ALWAYS refresh (stale override)
 * - If data > 12 hours old: refresh (normal interval)
 * - Otherwise: return cached data
 *
 * No cron jobs - refresh only happens when users request data!
 */
@Injectable()
export class CommoditiesService implements OnModuleInit {
  private readonly logger = new Logger(CommoditiesService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  // In-memory cache for commodity prices
  private priceCache: Map<string, CommodityPrice> = new Map();
  private lastFullUpdate: Date | null = null;
  private isRefreshing: boolean = false; // Prevent concurrent refreshes

  // Rate limiting configuration
  // 25 API calls/day, 12 commodities = ~2 refreshes/day
  // Minimum 12 hours between refreshes, stale override at 24 hours
  private readonly TOTAL_COMMODITIES = 12;
  private readonly API_CALLS_PER_DAY = 25;
  private readonly REFRESHES_PER_DAY = Math.floor(
    this.API_CALLS_PER_DAY / this.TOTAL_COMMODITIES,
  ); // = 2
  private readonly MIN_REFRESH_INTERVAL_MS =
    (24 / this.REFRESHES_PER_DAY) * 60 * 60 * 1000; // 12 hours
  private readonly STALE_DATA_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours - always refresh if older

  // Commodity configurations for Alpha Vantage
  private readonly commodityConfigs: CommodityConfig[] = [
    // Energy
    {
      function: 'WTI',
      symbol: 'CL',
      name: 'Crude Oil WTI',
      category: 'Energy',
      unit: 'per bbl',
    },
    {
      function: 'BRENT',
      symbol: 'BZ',
      name: 'Brent Crude',
      category: 'Energy',
      unit: 'per bbl',
    },
    {
      function: 'NATURAL_GAS',
      symbol: 'NG',
      name: 'Natural Gas',
      category: 'Energy',
      unit: 'per MMBtu',
    },

    // Industrial Metals
    {
      function: 'COPPER',
      symbol: 'HG',
      name: 'Copper',
      category: 'Metals',
      unit: 'per lb',
    },
    {
      function: 'ALUMINUM',
      symbol: 'ALI',
      name: 'Aluminum',
      category: 'Metals',
      unit: 'per MT',
    },

    // Agricultural
    {
      function: 'WHEAT',
      symbol: 'ZW',
      name: 'Wheat',
      category: 'Agricultural',
      unit: 'per bu',
    },
    {
      function: 'CORN',
      symbol: 'ZC',
      name: 'Corn',
      category: 'Agricultural',
      unit: 'per bu',
    },
    {
      function: 'COTTON',
      symbol: 'CT',
      name: 'Cotton',
      category: 'Agricultural',
      unit: 'per lb',
    },
    {
      function: 'SUGAR',
      symbol: 'SB',
      name: 'Sugar #11',
      category: 'Agricultural',
      unit: 'per lb',
    },
    {
      function: 'COFFEE',
      symbol: 'KC',
      name: 'Coffee',
      category: 'Agricultural',
      unit: 'per lb',
    },
  ];

  // Precious metals (separate endpoints)
  private readonly preciousMetals = [
    { function: 'GOLD', symbol: 'GC', name: 'Gold', unit: 'per oz' },
    { function: 'SILVER', symbol: 'SI', name: 'Silver', unit: 'per oz' },
  ];

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY') || '';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
    });

    if (!this.apiKey) {
      this.logger.warn(
        'ALPHA_VANTAGE_API_KEY not configured. Using fallback mock data. ' +
          'Get a free API key at https://www.alphavantage.co/support/#api-key',
      );
    } else {
      this.logger.log('Alpha Vantage API configured. Lazy-refresh enabled.');
      this.logger.log(
        `Refresh interval: ${this.MIN_REFRESH_INTERVAL_MS / (60 * 60 * 1000)} hours`,
      );
      this.logger.log(
        `Stale threshold: ${this.STALE_DATA_THRESHOLD_MS / (60 * 60 * 1000)} hours`,
      );
    }
  }

  /**
   * Initialize service on module startup
   * No mock data - real data will be fetched on first user request
   */
  async onModuleInit() {
    if (this.apiKey) {
      this.logger.log(
        'Commodity service initialized. Real data will be fetched on first request.',
      );
    } else {
      this.logger.warn(
        'Commodity service initialized WITHOUT API key. No data will be available.',
      );
    }
  }

  /**
   * Check if data needs refresh based on last update time
   */
  private shouldRefresh(): { shouldRefresh: boolean; reason: string } {
    // No API key - never refresh, use mock data
    if (!this.apiKey) {
      return { shouldRefresh: false, reason: 'No API key configured' };
    }

    // Currently refreshing - don't start another
    if (this.isRefreshing) {
      return { shouldRefresh: false, reason: 'Refresh already in progress' };
    }

    // Never updated with real data - needs refresh
    if (!this.lastFullUpdate) {
      return { shouldRefresh: true, reason: 'Initial load - no previous data' };
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastFullUpdate.getTime();

    // Data is very stale (> 24 hours) - ALWAYS refresh
    if (timeSinceLastUpdate >= this.STALE_DATA_THRESHOLD_MS) {
      return { shouldRefresh: true, reason: 'Data is stale (> 24 hours)' };
    }

    // Normal interval check (> 12 hours)
    if (timeSinceLastUpdate >= this.MIN_REFRESH_INTERVAL_MS) {
      return {
        shouldRefresh: true,
        reason: 'Normal refresh interval passed (> 12 hours)',
      };
    }

    // Data is fresh enough
    const hoursUntilRefresh =
      (this.MIN_REFRESH_INTERVAL_MS - timeSinceLastUpdate) / (60 * 60 * 1000);
    return {
      shouldRefresh: false,
      reason: `Data is fresh. Next refresh in ${hoursUntilRefresh.toFixed(1)} hours`,
    };
  }

  /**
   * Get all commodity prices with summary
   * This is the main endpoint - triggers lazy refresh if needed
   */
  async getPriceSummary(): Promise<CommodityPriceSummary> {
    // No API key configured - return empty response
    if (!this.apiKey) {
      return {
        prices: [],
        lastUpdated: null,
        delayMinutes: 15,
        totalCount: 0,
        nextRefreshAt: null,
        refreshIntervalHours: this.MIN_REFRESH_INTERVAL_MS / (60 * 60 * 1000),
        dataSource: 'Unavailable - API key not configured',
        isLoading: false,
      };
    }

    // Check if we should refresh
    const { shouldRefresh, reason } = this.shouldRefresh();

    if (shouldRefresh) {
      this.logger.log(`Triggering refresh: ${reason}`);
      // Don't await - let refresh happen in background while returning cached data
      this.refreshAllPrices().catch((err) => {
        this.logger.error(`Background refresh failed: ${err.message}`);
      });
    } else {
      this.logger.debug(`Skipping refresh: ${reason}`);
    }

    const prices = Array.from(this.priceCache.values());

    // Calculate next refresh time
    let nextRefreshAt: string | null = null;
    if (this.lastFullUpdate) {
      const nextRefreshTime = new Date(
        this.lastFullUpdate.getTime() + this.MIN_REFRESH_INTERVAL_MS,
      );
      nextRefreshAt = nextRefreshTime.toISOString();
    }

    return {
      prices,
      lastUpdated: this.lastFullUpdate?.toISOString() || null,
      delayMinutes: 15,
      totalCount: prices.length,
      nextRefreshAt,
      refreshIntervalHours: this.MIN_REFRESH_INTERVAL_MS / (60 * 60 * 1000),
      dataSource: 'Alpha Vantage',
      isLoading: this.isRefreshing,
    };
  }

  /**
   * Get price for a single commodity by symbol
   */
  async getPriceBySymbol(symbol: string): Promise<CommodityPrice | null> {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Get prices by category
   */
  async getPricesByCategory(
    category: CommodityCategory,
  ): Promise<CommodityPrice[]> {
    return Array.from(this.priceCache.values()).filter(
      (p) => p.category === category,
    );
  }

  /**
   * Force refresh - can be called by admin endpoint if needed
   * Returns whether refresh was triggered
   */
  async forceRefresh(): Promise<{ triggered: boolean; reason: string }> {
    if (!this.apiKey) {
      return { triggered: false, reason: 'No API key configured' };
    }
    if (this.isRefreshing) {
      return { triggered: false, reason: 'Refresh already in progress' };
    }

    this.logger.log('Force refresh triggered');
    await this.refreshAllPrices();
    return { triggered: true, reason: 'Refresh completed' };
  }

  /**
   * Refresh all commodity prices from Alpha Vantage
   * Staggered requests to respect rate limits (5 requests/minute)
   */
  private async refreshAllPrices(): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('Cannot refresh prices: No API key configured');
      return;
    }

    // Prevent concurrent refreshes
    if (this.isRefreshing) {
      this.logger.warn('Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    this.logger.log('Starting commodity price refresh from Alpha Vantage...');

    let successCount = 0;
    let errorCount = 0;

    try {
      // Fetch main commodities
      for (const config of this.commodityConfigs) {
        try {
          const price = await this.fetchCommodityPrice(config);
          if (price) {
            this.priceCache.set(config.symbol, price);
            successCount++;
          } else {
            errorCount++;
          }
          // Rate limiting: wait 1.5 seconds between requests (Alpha Vantage allows 5/min)
          await this.sleep(1500);
        } catch (error) {
          this.logger.error(`Failed to fetch ${config.name}: ${error.message}`);
          errorCount++;
        }
      }

      // Fetch precious metals
      for (const metal of this.preciousMetals) {
        try {
          await this.sleep(1500);
          const price = await this.fetchPreciousMetalPrice(metal);
          if (price) {
            this.priceCache.set(metal.symbol, price);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to fetch ${metal.name}: ${error.message}`);
          errorCount++;
        }
      }

      // Only update lastFullUpdate if we had some success
      if (successCount > 0) {
        this.lastFullUpdate = new Date();
        this.logger.log(
          `Commodity refresh complete: ${successCount} success, ${errorCount} errors. ` +
            `Next refresh available after ${new Date(this.lastFullUpdate.getTime() + this.MIN_REFRESH_INTERVAL_MS).toISOString()}`,
        );
      } else {
        this.logger.error('Commodity refresh failed: no successful fetches');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Fetch a single commodity price from Alpha Vantage
   */
  private async fetchCommodityPrice(
    config: CommodityConfig,
  ): Promise<CommodityPrice | null> {
    try {
      const response = await this.httpClient.get('', {
        params: {
          function: config.function,
          interval: 'daily',
          apikey: this.apiKey,
        },
      });

      const data = response.data;

      // Check for API error responses
      if (data['Error Message']) {
        this.logger.error(
          `Alpha Vantage error for ${config.name}: ${data['Error Message']}`,
        );
        return null;
      }

      // Check for rate limit warning
      if (data['Note']) {
        this.logger.warn(
          `Alpha Vantage rate limit for ${config.name}: ${data['Note']}`,
        );
        return null;
      }

      // Parse the response - Alpha Vantage returns data in a "data" array
      const dataKey = Object.keys(data).find((k) => k.includes('data'));
      if (
        !dataKey ||
        !data[dataKey] ||
        !Array.isArray(data[dataKey]) ||
        data[dataKey].length === 0
      ) {
        this.logger.warn(`No data found for ${config.name}`);
        return null;
      }

      const rawData = data[dataKey];
      const latestData = rawData[0];
      const previousData = rawData[1] || latestData;

      const currentPrice = parseFloat(latestData.value);
      const previousPrice = parseFloat(previousData.value);
      const change = currentPrice - previousPrice;
      const changePercent =
        previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

      // Extract last 7 days of price history for sparklines
      const priceHistory: PriceHistoryPoint[] = rawData
        .slice(0, 7)
        .map((point: { date?: string; timestamp?: string; value: string }) => ({
          date: point.date || point.timestamp || '',
          value: Math.round(parseFloat(point.value) * 100) / 100,
        }))
        .reverse(); // Oldest first for chart rendering

      // Calculate 7-day high and low (with safeguard for empty arrays)
      const weekPrices = priceHistory.map((p) => p.value).filter((v) => !isNaN(v));
      const weekHigh = weekPrices.length > 0 ? Math.max(...weekPrices) : currentPrice;
      const weekLow = weekPrices.length > 0 ? Math.min(...weekPrices) : currentPrice;

      this.logger.debug(
        `Fetched ${config.name}: $${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) | 7d range: $${weekLow.toFixed(2)}-$${weekHigh.toFixed(2)}`,
      );

      return {
        _id: `commodity-${config.symbol}`,
        symbol: config.symbol,
        name: config.name,
        price: Math.round(currentPrice * 100) / 100,
        currency: 'USD',
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        exchange: 'ALPHA_VANTAGE',
        category: config.category,
        unit: config.unit,
        fetchedAt: new Date().toISOString(),
        delayMinutes: 15,
        isActive: true,
        priceHistory,
        weekHigh: Math.round(weekHigh * 100) / 100,
        weekLow: Math.round(weekLow * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error fetching ${config.name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch precious metal price (Gold/Silver) using dedicated endpoints
   */
  private async fetchPreciousMetalPrice(metal: {
    function: string;
    symbol: string;
    name: string;
    unit: string;
  }): Promise<CommodityPrice | null> {
    try {
      const response = await this.httpClient.get('', {
        params: {
          function: metal.function,
          apikey: this.apiKey,
        },
      });

      const data = response.data;

      if (data['Error Message']) {
        this.logger.error(
          `Alpha Vantage error for ${metal.name}: ${data['Error Message']}`,
        );
        return null;
      }

      if (data['Note']) {
        this.logger.warn(
          `Alpha Vantage rate limit for ${metal.name}: ${data['Note']}`,
        );
        return null;
      }

      const dataKey = Object.keys(data).find((k) => k.includes('data'));
      if (!dataKey || !data[dataKey] || data[dataKey].length === 0) {
        this.logger.warn(`No data found for ${metal.name}`);
        return null;
      }

      const rawData = data[dataKey];
      const latestData = rawData[0];
      const previousData = rawData[1] || latestData;

      const currentPrice = parseFloat(latestData.value);
      const previousPrice = parseFloat(previousData.value);
      const change = currentPrice - previousPrice;
      const changePercent =
        previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

      // Extract last 7 days of price history for sparklines
      const priceHistory: PriceHistoryPoint[] = rawData
        .slice(0, 7)
        .map((point: { date?: string; timestamp?: string; value: string }) => ({
          date: point.date || point.timestamp || '',
          value: Math.round(parseFloat(point.value) * 100) / 100,
        }))
        .reverse(); // Oldest first for chart rendering

      // Calculate 7-day high and low (with safeguard for empty arrays)
      const weekPrices = priceHistory.map((p) => p.value).filter((v) => !isNaN(v));
      const weekHigh = weekPrices.length > 0 ? Math.max(...weekPrices) : currentPrice;
      const weekLow = weekPrices.length > 0 ? Math.min(...weekPrices) : currentPrice;

      this.logger.debug(
        `Fetched ${metal.name}: $${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) | 7d range: $${weekLow.toFixed(2)}-$${weekHigh.toFixed(2)}`,
      );

      return {
        _id: `commodity-${metal.symbol}`,
        symbol: metal.symbol,
        name: metal.name,
        price: Math.round(currentPrice * 100) / 100,
        currency: 'USD',
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        exchange: 'ALPHA_VANTAGE',
        category: 'Precious Metals',
        unit: metal.unit,
        fetchedAt: new Date().toISOString(),
        delayMinutes: 15,
        isActive: true,
        priceHistory,
        weekHigh: Math.round(weekHigh * 100) / 100,
        weekLow: Math.round(weekLow * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error fetching ${metal.name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper function to sleep for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
