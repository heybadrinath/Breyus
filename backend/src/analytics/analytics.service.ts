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
    'india': 'https://flagcdn.com/w40/in.png',
    'united states': 'https://flagcdn.com/w40/us.png',
    'usa': 'https://flagcdn.com/w40/us.png',
    'united kingdom': 'https://flagcdn.com/w40/gb.png',
    'uk': 'https://flagcdn.com/w40/gb.png',
    'germany': 'https://flagcdn.com/w40/de.png',
    'france': 'https://flagcdn.com/w40/fr.png',
    'china': 'https://flagcdn.com/w40/cn.png',
    'japan': 'https://flagcdn.com/w40/jp.png',
    'canada': 'https://flagcdn.com/w40/ca.png',
    'australia': 'https://flagcdn.com/w40/au.png',
    'brazil': 'https://flagcdn.com/w40/br.png',
    'mexico': 'https://flagcdn.com/w40/mx.png',
    'singapore': 'https://flagcdn.com/w40/sg.png',
    'uae': 'https://flagcdn.com/w40/ae.png',
    'united arab emirates': 'https://flagcdn.com/w40/ae.png',
    'south korea': 'https://flagcdn.com/w40/kr.png',
    'netherlands': 'https://flagcdn.com/w40/nl.png',
    'italy': 'https://flagcdn.com/w40/it.png',
    'spain': 'https://flagcdn.com/w40/es.png',
    'russia': 'https://flagcdn.com/w40/ru.png',
    'thailand': 'https://flagcdn.com/w40/th.png',
    'chile': 'https://flagcdn.com/w40/cl.png',
    'argentina': 'https://flagcdn.com/w40/ar.png',
    'england': 'https://flagcdn.com/w40/gb.png',
};

// Cache TTL in seconds (15 minutes)
const CACHE_TTL = 900;

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectModel(Trade.name) private tradeModel: Model<Trade>,
        @InjectModel(Product.name) private productModel: Model<Product>,
        @InjectModel(Company.name) private companyModel: Model<Company>,
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
     * Get product IDs for a company
     * FIX: Uses userId field instead of seller (which doesn't exist in Product schema)
     */
    private async getProductIdsForCompany(companyId: string): Promise<Types.ObjectId[]> {
        // Product schema uses userId (string) to reference the seller
        // We need to find products where userId matches any user in the company
        // OR where userId matches the companyId directly (for legacy data)

        const products = await this.productModel.find({
            $or: [
                { userId: companyId },
                { userId: { $exists: true } }
            ]
        }).select('_id userId').lean();

        // Filter to only products belonging to this company
        // The userId in Product is the user's _id as a string
        // We need to check if that user belongs to this company
        const company = await this.companyModel.findById(companyId).select('users').lean();
        const userIds = company?.users?.map(u => u.toString()) || [];

        const filteredProducts = products.filter(p => {
            const productUserId = p.userId?.toString();
            // Check if product's userId matches any user in the company OR the companyId itself
            return userIds.includes(productUserId) || productUserId === companyId;
        });

        return filteredProducts.map(p => p._id as Types.ObjectId);
    }

    private async getMetricsForPeriod(
        productIds: Types.ObjectId[],
        startDate: Date,
        endDate: Date,
    ): Promise<{ visits: number; sales: number; revenue: number; customers: number }> {
        if (productIds.length === 0) {
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
        const trades = await this.tradeModel.find({
            ...dateFilter,
            tradePhase: 'COMPLETED',
        }).lean();

        let totalRevenue = 0;
        for (const trade of trades) {
            const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
            const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
            totalRevenue += price * quantity;
        }

        // Get unique buyers (customers) in this period
        const uniqueBuyers = await this.tradeModel.distinct('buyer', dateFilter);

        // Total trades as proxy for visits
        const totalTrades = await this.tradeModel.countDocuments(dateFilter);

        return {
            visits: totalTrades * 5,
            sales: completedTrades,
            revenue: Math.round(totalRevenue),
            customers: uniqueBuyers.length,
        };
    }

    // ========================================================================
    // EXISTING ENDPOINTS (Dashboard)
    // ========================================================================

    async getMetricsData(companyId: string, dateRange: DateRange): Promise<MetricsData> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'metrics', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                const current = await this.getMetricsForPeriod(
                    productIds,
                    dateRange.startDate,
                    dateRange.endDate,
                );

                const { prevStartDate, prevEndDate } = getPreviousPeriodRange(
                    dateRange.startDate,
                    dateRange.endDate,
                );
                const previous = await this.getMetricsForPeriod(productIds, prevStartDate, prevEndDate);

                const comparison: MetricsComparison = {
                    visitsChange: this.calculatePercentageChange(current.visits, previous.visits),
                    salesChange: this.calculatePercentageChange(current.sales, previous.sales),
                    revenueChange: this.calculatePercentageChange(current.revenue, previous.revenue),
                    customersChange: this.calculatePercentageChange(current.customers, previous.customers),
                };

                return {
                    totalVisits: current.visits,
                    totalSales: current.sales,
                    totalRevenue: current.revenue,
                    totalCustomers: current.customers,
                    comparison,
                };
            } catch (error) {
                this.logger.error('Error fetching metrics:', error);
                return {
                    totalVisits: 0,
                    totalSales: 0,
                    totalRevenue: 0,
                    totalCustomers: 0,
                    comparison: { visitsChange: 0, salesChange: 0, revenueChange: 0, customersChange: 0 },
                };
            }
        }, CACHE_TTL);
    }

    async getBarGraphData(companyId: string, dateRange: DateRange): Promise<BarGraphData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'bar-data', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [];
                }

                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                }).lean();

                const daysDiff = Math.ceil(
                    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                );

                const dataByDate: { [key: string]: number } = {};
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                if (daysDiff <= 7) {
                    for (let i = daysDiff - 1; i >= 0; i--) {
                        const date = new Date(dateRange.endDate);
                        date.setDate(date.getDate() - i);
                        const dayName = days[date.getDay()];
                        dataByDate[dayName] = 0;
                    }

                    for (const trade of trades) {
                        const tradeDate = new Date(trade.createdAt);
                        const dayName = days[tradeDate.getDay()];
                        if (dataByDate[dayName] !== undefined) {
                            dataByDate[dayName] += 1;
                        }
                    }
                } else {
                    const numBuckets = Math.min(daysDiff, 12);
                    const bucketSize = Math.ceil(daysDiff / numBuckets);

                    for (let i = 0; i < numBuckets; i++) {
                        const bucketStart = new Date(dateRange.startDate);
                        bucketStart.setDate(bucketStart.getDate() + i * bucketSize);
                        const label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        dataByDate[label] = 0;
                    }

                    for (const trade of trades) {
                        const tradeDate = new Date(trade.createdAt);
                        const daysSinceStart = Math.floor(
                            (tradeDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                        );
                        const bucketIndex = Math.min(Math.floor(daysSinceStart / bucketSize), numBuckets - 1);
                        const bucketStart = new Date(dateRange.startDate);
                        bucketStart.setDate(bucketStart.getDate() + bucketIndex * bucketSize);
                        const label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        if (dataByDate[label] !== undefined) {
                            dataByDate[label] += 1;
                        }
                    }
                }

                return Object.entries(dataByDate).map(([date, storeVisits]) => ({
                    date,
                    storeVisits: storeVisits * 3,
                }));
            } catch (error) {
                this.logger.error('Error fetching bar graph data:', error);
                return [];
            }
        }, CACHE_TTL);
    }

    async getScatterGraphData(companyId: string, dateRange: DateRange): Promise<ScatterGraphData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'scatter-data', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [];
                }

                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                }).lean();

                const daysDiff = Math.ceil(
                    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                );

                const dataByDay: { [key: number]: number } = {};
                const numPoints = Math.min(daysDiff, 30);

                for (let i = 1; i <= numPoints; i++) {
                    dataByDay[i] = 0;
                }

                for (const trade of trades) {
                    const tradeDate = new Date(trade.createdAt);
                    const daysSinceStart = Math.floor(
                        (tradeDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    const pointIndex = Math.min(Math.floor((daysSinceStart / daysDiff) * numPoints) + 1, numPoints);
                    if (dataByDay[pointIndex] !== undefined) {
                        dataByDay[pointIndex] += parseFloat(trade.buyerOfferedPrice?.toString() || '0') || 0;
                    }
                }

                return Object.entries(dataByDay).map(([day, value]) => ({
                    x: parseInt(day),
                    y: Math.round(value),
                }));
            } catch (error) {
                this.logger.error('Error fetching scatter graph data:', error);
                return [];
            }
        }, CACHE_TTL);
    }

    async getPieChartData(companyId: string, dateRange: DateRange): Promise<PieChartData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'pie-data', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [
                        { category: 'New Customers', value: 1 },
                        { category: 'Returning', value: 1 },
                    ];
                }

                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                }).lean();

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
        }, CACHE_TTL);
    }

    /**
     * Get country sales data
     * FIX: Uses selectedAddress.country (delivery destination) instead of buyer's company address
     */
    async getCountrySalesData(companyId: string, dateRange: DateRange): Promise<CountrySalesData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'country-sales', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [];
                }

                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                }).lean();

                if (trades.length === 0) {
                    return [];
                }

                // Get company for currency
                const company = await this.companyModel.findById(companyId).select('currency').lean();
                const currency = (company as any)?.currency || 'USD';
                const currencySymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';

                // Aggregate by delivery destination country (from selectedAddress)
                const countryData: { [country: string]: { sales: number; value: number } } = {};

                for (const trade of trades) {
                    // FIX: Use the trade's selectedAddress.country (delivery destination)
                    const country = (trade as any).selectedAddress?.country || 'Unknown';
                    const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
                    const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;

                    if (!countryData[country]) {
                        countryData[country] = { sales: 0, value: 0 };
                    }
                    countryData[country].sales += 1;
                    countryData[country].value += price * quantity;
                }

                const totalSales = Object.values(countryData).reduce((sum, d) => sum + d.sales, 0);

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
        }, CACHE_TTL);
    }

    // ========================================================================
    // NEW ENDPOINTS (Sales Page)
    // ========================================================================

    /**
     * Get comprehensive sales metrics for the Sales page
     */
    async getSalesMetricsData(companyId: string, dateRange: DateRange): Promise<SalesMetricsData> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'sales-metrics', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                // Get company for currency
                const company = await this.companyModel.findById(companyId).select('currency').lean();
                const currency = (company as any)?.currency || 'USD';

                if (productIds.length === 0) {
                    return this.getEmptySalesMetrics(currency);
                }

                // Get current period data
                const current = await this.getSalesMetricsForPeriod(productIds, dateRange.startDate, dateRange.endDate);

                // Get previous period data for comparison
                const { prevStartDate, prevEndDate } = getPreviousPeriodRange(dateRange.startDate, dateRange.endDate);
                const previous = await this.getSalesMetricsForPeriod(productIds, prevStartDate, prevEndDate);

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
                        salesChange: this.calculatePercentageChange(current.totalSales, previous.totalSales),
                        volumeChange: this.calculatePercentageChange(current.totalVolume, previous.totalVolume),
                        revenueChange: this.calculatePercentageChange(current.totalRevenue, previous.totalRevenue),
                        averageOrderChange: this.calculatePercentageChange(current.averageOrderValue, previous.averageOrderValue),
                        customersChange: this.calculatePercentageChange(current.totalCustomers, previous.totalCustomers),
                    },
                };
            } catch (error) {
                this.logger.error('Error fetching sales metrics:', error);
                return this.getEmptySalesMetrics('USD');
            }
        }, CACHE_TTL);
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
        const completedTrades = allTrades.filter(t => t.tradePhase === 'COMPLETED');

        // Calculate metrics
        let totalVolume = 0;
        let totalRevenue = 0;

        for (const trade of completedTrades) {
            const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
            const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
            totalVolume += quantity;
            totalRevenue += price * quantity;
        }

        const totalSales = completedTrades.length;
        const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

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
    async getTopProductsData(companyId: string, dateRange: DateRange): Promise<TopProductData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'top-products', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [];
                }

                // Get trades grouped by product
                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                    tradePhase: 'COMPLETED',
                }).lean();

                // Aggregate by product
                const productStats: { [productId: string]: { count: number; value: number } } = {};

                for (const trade of trades) {
                    const productId = trade.product?.toString();
                    if (!productId) continue;

                    if (!productStats[productId]) {
                        productStats[productId] = { count: 0, value: 0 };
                    }

                    const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
                    const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;

                    productStats[productId].count += 1;
                    productStats[productId].value += price * quantity;
                }

                // Get product names
                const productIdList = Object.keys(productStats);
                const products = await this.productModel.find({
                    _id: { $in: productIdList.map(id => new Types.ObjectId(id)) }
                }).select('_id name').lean();

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
        }, CACHE_TTL);
    }

    /**
     * Get time series data for line/area charts
     */
    async getTimeSeriesData(companyId: string, dateRange: DateRange): Promise<TimeSeriesData[]> {
        const cacheKey = this.cacheService.generateAnalyticsKey(
            companyId, 'time-series', `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
        );

        return this.cacheService.getOrSet(cacheKey, async () => {
            try {
                const productIds = await this.getProductIdsForCompany(companyId);

                if (productIds.length === 0) {
                    return [];
                }

                const trades = await this.tradeModel.find({
                    product: { $in: productIds },
                    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                    tradePhase: 'COMPLETED',
                }).lean();

                const daysDiff = Math.ceil(
                    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                );

                // Determine number of data points and bucket size
                const numBuckets = Math.min(daysDiff, 12);
                const bucketSize = Math.ceil(daysDiff / numBuckets);

                // Initialize buckets
                const buckets: { [label: string]: { revenue: number; volume: number } } = {};
                const bucketLabels: string[] = [];

                for (let i = 0; i < numBuckets; i++) {
                    const bucketStart = new Date(dateRange.startDate);
                    bucketStart.setDate(bucketStart.getDate() + i * bucketSize);

                    let label: string;
                    if (daysDiff <= 7) {
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        label = days[bucketStart.getDay()];
                    } else {
                        label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }

                    bucketLabels.push(label);
                    buckets[label] = { revenue: 0, volume: 0 };
                }

                // Aggregate trades into buckets
                for (const trade of trades) {
                    const tradeDate = new Date(trade.createdAt);
                    const daysSinceStart = Math.floor(
                        (tradeDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    const bucketIndex = Math.min(Math.floor(daysSinceStart / bucketSize), numBuckets - 1);
                    const label = bucketLabels[bucketIndex];

                    if (buckets[label]) {
                        const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
                        const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;

                        buckets[label].revenue += price * quantity;
                        buckets[label].volume += quantity;
                    }
                }

                // Convert to array maintaining order
                return bucketLabels.map(label => ({
                    date: label,
                    revenue: Math.round(buckets[label].revenue),
                    volume: Math.round(buckets[label].volume),
                }));
            } catch (error) {
                this.logger.error('Error fetching time series data:', error);
                return [];
            }
        }, CACHE_TTL);
    }

    /**
     * Invalidate cache for a company (call when trades are created/updated)
     */
    async invalidateCompanyCache(companyId: string): Promise<void> {
        await this.cacheService.invalidateCompanyAnalytics(companyId);
    }
}
