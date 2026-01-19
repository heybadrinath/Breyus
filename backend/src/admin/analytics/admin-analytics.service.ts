/**
 * Admin Analytics Service
 *
 * Provides platform-wide analytics for the admin portal:
 * - Overview metrics (users, trades, products, revenue)
 * - Trade analytics (funnel, phase timing, rejections)
 * - User analytics (registrations, geographic, onboarding funnel)
 * - Financial analytics (value over time, by category, by incoterm)
 * - Operational metrics (KYC backlog, stalled trades)
 *
 * Uses Redis caching with 15-minute TTL for performance.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade, TradePhase } from '../../trade/schema/trade.schema';
import { Product } from '../../products/schema/products.schema';
import { Company, KycDocumentStatus } from '../../company/company.schema';
import { User } from '../../users/user.schema';
import { CacheService } from '../../common/cache/cache.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Overview Metrics
export interface PlatformOverview {
  users: {
    total: number;
    active: number;
    new: number;
    change: number;
  };
  trades: {
    total: number;
    active: number;
    completed: number;
    change: number;
  };
  products: {
    total: number;
    change: number;
  };
  revenue: {
    total: number;
    change: number;
  };
}

// Trade Analytics
export interface TradeTimeSeries {
  date: string;
  count: number;
  value: number;
}

export interface TradeFunnel {
  phase: string;
  count: number;
}

export interface PhaseTiming {
  phase: string;
  avgDays: number;
}

export interface RejectionReason {
  reason: string;
  count: number;
}

export interface TradeAnalytics {
  timeSeries: TradeTimeSeries[];
  funnel: TradeFunnel[];
  phaseTimings: PhaseTiming[];
  rejectionReasons: RejectionReason[];
  completionRate: number;
}

// User Analytics
export interface UserRegistration {
  date: string;
  count: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
}

export interface GeographicDistribution {
  country: string;
  count: number;
}

export interface OnboardingFunnelStep {
  step: string;
  count: number;
  dropoff: number;
}

export interface UserAnalytics {
  registrations: UserRegistration[];
  roleDistribution: RoleDistribution[];
  geographic: GeographicDistribution[];
  onboardingFunnel: OnboardingFunnelStep[];
  activationRate: number;
}

// Financial Analytics
export interface ValueTimeSeries {
  date: string;
  value: number;
}

export interface CategoryValue {
  category: string;
  value: number;
}

export interface IncotermUsage {
  incoterm: string;
  value: number;
  count: number;
}

export interface FinancialAnalytics {
  valueTimeSeries: ValueTimeSeries[];
  avgDealSize: number;
  avgDealSizeChange: number;
  byCategory: CategoryValue[];
  byIncoterm: IncotermUsage[];
}

// Operational Metrics
export interface KycBacklog {
  pending: number;
  avgWaitDays: number;
}

export interface DocumentProcessing {
  avgHours: number;
  byType: { type: string; avgHours: number }[];
}

export interface OperationalMetrics {
  kycBacklog: KycBacklog;
  documentProcessing: DocumentProcessing;
  stalledTrades: { count: number; threshold: number };
}

// Cache TTL in seconds (15 minutes)
const CACHE_TTL = 900;

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

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

  private getDefaultDateRange(): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }

  private getPreviousPeriodRange(startDate: Date, endDate: Date): { prevStartDate: Date; prevEndDate: Date } {
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodMs);
    return { prevStartDate, prevEndDate };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  private parseDateRange(startDateStr?: string, endDateStr?: string): DateRange {
    if (startDateStr && endDateStr) {
      return {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
      };
    }
    return this.getDefaultDateRange();
  }

  private formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    if (groupBy === 'month') {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } else if (groupBy === 'week') {
      // Get the week start (Monday)
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ========================================================================
  // OVERVIEW METRICS
  // ========================================================================

  async getOverviewMetrics(startDateStr?: string, endDateStr?: string): Promise<PlatformOverview> {
    const dateRange = this.parseDateRange(startDateStr, endDateStr);
    const cacheKey = `admin:analytics:overview:${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      try {
        const { prevStartDate, prevEndDate } = this.getPreviousPeriodRange(
          dateRange.startDate,
          dateRange.endDate,
        );

        // Users metrics
        const totalUsers = await this.userModel.countDocuments();
        const newUsers = await this.userModel.countDocuments({
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        });
        const prevNewUsers = await this.userModel.countDocuments({
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        });

        // Active users (users with trades in the period)
        const activeUserIds = await this.tradeModel.distinct('buyer', {
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        });
        const activeSellerIds = await this.tradeModel.distinct('seller', {
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        });
        const uniqueActiveUsers = new Set([...activeUserIds, ...activeSellerIds]);
        const activeUsers = uniqueActiveUsers.size;

        // Trades metrics
        const totalTrades = await this.tradeModel.countDocuments();
        const activeTrades = await this.tradeModel.countDocuments({
          tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        });
        const completedTrades = await this.tradeModel.countDocuments({
          tradePhase: 'COMPLETED',
        });

        const periodTrades = await this.tradeModel.countDocuments({
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        });
        const prevPeriodTrades = await this.tradeModel.countDocuments({
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        });

        // Products metrics
        const totalProducts = await this.productModel.countDocuments();
        const newProducts = await this.productModel.countDocuments({
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        });
        const prevNewProducts = await this.productModel.countDocuments({
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        });

        // Revenue (completed trades value)
        const completedTradesInPeriod = await this.tradeModel.find({
          tradePhase: 'COMPLETED',
          completedAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        }).lean();

        let currentRevenue = 0;
        for (const trade of completedTradesInPeriod) {
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          currentRevenue += price * quantity;
        }

        const prevCompletedTrades = await this.tradeModel.find({
          tradePhase: 'COMPLETED',
          completedAt: { $gte: prevStartDate, $lte: prevEndDate },
        }).lean();

        let prevRevenue = 0;
        for (const trade of prevCompletedTrades) {
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          prevRevenue += price * quantity;
        }

        return {
          users: {
            total: totalUsers,
            active: activeUsers,
            new: newUsers,
            change: this.calculatePercentageChange(newUsers, prevNewUsers),
          },
          trades: {
            total: totalTrades,
            active: activeTrades,
            completed: completedTrades,
            change: this.calculatePercentageChange(periodTrades, prevPeriodTrades),
          },
          products: {
            total: totalProducts,
            change: this.calculatePercentageChange(newProducts, prevNewProducts),
          },
          revenue: {
            total: Math.round(currentRevenue),
            change: this.calculatePercentageChange(currentRevenue, prevRevenue),
          },
        };
      } catch (error) {
        this.logger.error('Error fetching overview metrics:', error);
        return this.getEmptyOverview();
      }
    }, CACHE_TTL);
  }

  private getEmptyOverview(): PlatformOverview {
    return {
      users: { total: 0, active: 0, new: 0, change: 0 },
      trades: { total: 0, active: 0, completed: 0, change: 0 },
      products: { total: 0, change: 0 },
      revenue: { total: 0, change: 0 },
    };
  }

  // ========================================================================
  // TRADE ANALYTICS
  // ========================================================================

  async getTradeAnalytics(
    startDateStr?: string,
    endDateStr?: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<TradeAnalytics> {
    const dateRange = this.parseDateRange(startDateStr, endDateStr);
    const cacheKey = `admin:analytics:trades:${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}-${groupBy}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      try {
        const trades = await this.tradeModel.find({
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        }).lean();

        // Time series
        const timeSeriesMap: Map<string, { count: number; value: number }> = new Map();
        for (const trade of trades) {
          const dateKey = this.formatDateKey(trade.createdAt, groupBy);
          const existing = timeSeriesMap.get(dateKey) || { count: 0, value: 0 };
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          existing.count += 1;
          existing.value += price * quantity;
          timeSeriesMap.set(dateKey, existing);
        }

        const timeSeries: TradeTimeSeries[] = Array.from(timeSeriesMap.entries())
          .map(([date, data]) => ({ date, count: data.count, value: Math.round(data.value) }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Funnel
        const phases: TradePhase[] = ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'];
        const funnel: TradeFunnel[] = [];
        for (const phase of phases) {
          const count = await this.tradeModel.countDocuments({ tradePhase: phase });
          funnel.push({ phase, count });
        }

        // Phase timings (average days spent in each phase)
        const phaseTimings: PhaseTiming[] = [];
        const phaseTimestampFields: Record<string, string[]> = {
          'PR → SCO': ['createdAt', 'scoSubmittedAt'],
          'SCO → ICPO': ['scoSubmittedAt', 'icpoSubmittedAt'],
          'ICPO → SPA': ['icpoSubmittedAt', 'spaUploadedAt'],
          'SPA → Payment': ['spaUploadedAt', 'paymentVerifiedAt'],
          'Payment → BoL': ['paymentVerifiedAt', 'bolUploadedAt'],
          'BoL → Complete': ['bolUploadedAt', 'completedAt'],
        };

        for (const [phaseName, [startField, endField]] of Object.entries(phaseTimestampFields)) {
          const tradesWithBothDates = await this.tradeModel.find({
            [startField]: { $exists: true },
            [endField]: { $exists: true },
          }).lean();

          if (tradesWithBothDates.length > 0) {
            const totalDays = tradesWithBothDates.reduce((sum, trade) => {
              const start = new Date(trade[startField]).getTime();
              const end = new Date(trade[endField]).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0);
            phaseTimings.push({
              phase: phaseName,
              avgDays: Math.round((totalDays / tradesWithBothDates.length) * 10) / 10,
            });
          } else {
            phaseTimings.push({ phase: phaseName, avgDays: 0 });
          }
        }

        // Rejection reasons
        const rejectedTrades = await this.tradeModel.find({
          negotiationStatus: 'rejected',
          rejectionReason: { $exists: true, $ne: '' },
        }).lean();

        const reasonCounts: Map<string, number> = new Map();
        for (const trade of rejectedTrades) {
          const reason = trade.rejectionReason || 'Unspecified';
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        }

        const rejectionReasons: RejectionReason[] = Array.from(reasonCounts.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Completion rate
        const totalTradesCount = await this.tradeModel.countDocuments();
        const completedTradesCount = await this.tradeModel.countDocuments({ tradePhase: 'COMPLETED' });
        const completionRate = totalTradesCount > 0
          ? Math.round((completedTradesCount / totalTradesCount) * 1000) / 10
          : 0;

        return {
          timeSeries,
          funnel,
          phaseTimings,
          rejectionReasons,
          completionRate,
        };
      } catch (error) {
        this.logger.error('Error fetching trade analytics:', error);
        return this.getEmptyTradeAnalytics();
      }
    }, CACHE_TTL);
  }

  private getEmptyTradeAnalytics(): TradeAnalytics {
    return {
      timeSeries: [],
      funnel: [],
      phaseTimings: [],
      rejectionReasons: [],
      completionRate: 0,
    };
  }

  // ========================================================================
  // USER ANALYTICS
  // ========================================================================

  async getUserAnalytics(startDateStr?: string, endDateStr?: string): Promise<UserAnalytics> {
    const dateRange = this.parseDateRange(startDateStr, endDateStr);
    const cacheKey = `admin:analytics:users:${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      try {
        // Registrations over time
        const users = await this.userModel.find({
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        }).lean();

        const registrationMap: Map<string, number> = new Map();
        for (const user of users) {
          const dateKey = this.formatDateKey(user.createdAt, 'day');
          registrationMap.set(dateKey, (registrationMap.get(dateKey) || 0) + 1);
        }

        const registrations: UserRegistration[] = Array.from(registrationMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Role distribution (from companies, as role is on company)
        const companies = await this.companyModel.find({}).lean();
        const roleCounts: Map<string, number> = new Map();
        for (const company of companies) {
          const role = company.role || 'Unknown';
          roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
        }

        const roleDistribution: RoleDistribution[] = Array.from(roleCounts.entries())
          .map(([role, count]) => ({ role, count }));

        // Geographic distribution (from company addresses)
        const countryCounts: Map<string, number> = new Map();
        for (const company of companies) {
          const addresses = company.deliveryAddresses || [];
          for (const address of addresses) {
            const country = address.country || 'Unknown';
            countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
          }
        }

        const geographic: GeographicDistribution[] = Array.from(countryCounts.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);

        // Onboarding funnel (based on onboardingProgress 0-100)
        const totalCompanies = companies.length;
        const step1 = companies.filter(c => c.onboardingProgress >= 25).length;
        const step2 = companies.filter(c => c.onboardingProgress >= 50).length;
        const step3 = companies.filter(c => c.onboardingProgress >= 75).length;
        const step4 = companies.filter(c => c.isOnboardingCompleted).length;

        const onboardingFunnel: OnboardingFunnelStep[] = [
          { step: 'Started', count: totalCompanies, dropoff: 0 },
          { step: 'Company Info', count: step1, dropoff: totalCompanies > 0 ? Math.round(((totalCompanies - step1) / totalCompanies) * 100) : 0 },
          { step: 'Business Details', count: step2, dropoff: step1 > 0 ? Math.round(((step1 - step2) / step1) * 100) : 0 },
          { step: 'Verification', count: step3, dropoff: step2 > 0 ? Math.round(((step2 - step3) / step2) * 100) : 0 },
          { step: 'Completed', count: step4, dropoff: step3 > 0 ? Math.round(((step3 - step4) / step3) * 100) : 0 },
        ];

        // Activation rate (users who have made at least one trade)
        const totalUsers = await this.userModel.countDocuments();
        const usersWithTrades = await this.tradeModel.distinct('buyer');
        const sellersWithTrades = await this.tradeModel.distinct('seller');
        const uniqueTradingUsers = new Set([...usersWithTrades, ...sellersWithTrades]);
        const activationRate = totalUsers > 0
          ? Math.round((uniqueTradingUsers.size / totalUsers) * 1000) / 10
          : 0;

        return {
          registrations,
          roleDistribution,
          geographic,
          onboardingFunnel,
          activationRate,
        };
      } catch (error) {
        this.logger.error('Error fetching user analytics:', error);
        return this.getEmptyUserAnalytics();
      }
    }, CACHE_TTL);
  }

  private getEmptyUserAnalytics(): UserAnalytics {
    return {
      registrations: [],
      roleDistribution: [],
      geographic: [],
      onboardingFunnel: [],
      activationRate: 0,
    };
  }

  // ========================================================================
  // FINANCIAL ANALYTICS
  // ========================================================================

  async getFinancialAnalytics(startDateStr?: string, endDateStr?: string): Promise<FinancialAnalytics> {
    const dateRange = this.parseDateRange(startDateStr, endDateStr);
    const cacheKey = `admin:analytics:financial:${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      try {
        const { prevStartDate, prevEndDate } = this.getPreviousPeriodRange(
          dateRange.startDate,
          dateRange.endDate,
        );

        // Get completed trades with product info
        const completedTrades = await this.tradeModel.find({
          tradePhase: 'COMPLETED',
          completedAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        }).populate('product').lean();

        const prevCompletedTrades = await this.tradeModel.find({
          tradePhase: 'COMPLETED',
          completedAt: { $gte: prevStartDate, $lte: prevEndDate },
        }).lean();

        // Value time series
        const valueMap: Map<string, number> = new Map();
        for (const trade of completedTrades) {
          const dateKey = this.formatDateKey(trade.completedAt!, 'day');
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          valueMap.set(dateKey, (valueMap.get(dateKey) || 0) + (price * quantity));
        }

        const valueTimeSeries: ValueTimeSeries[] = Array.from(valueMap.entries())
          .map(([date, value]) => ({ date, value: Math.round(value) }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Average deal size
        let currentTotalValue = 0;
        for (const trade of completedTrades) {
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          currentTotalValue += price * quantity;
        }
        const avgDealSize = completedTrades.length > 0
          ? Math.round(currentTotalValue / completedTrades.length)
          : 0;

        let prevTotalValue = 0;
        for (const trade of prevCompletedTrades) {
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          prevTotalValue += price * quantity;
        }
        const prevAvgDealSize = prevCompletedTrades.length > 0
          ? Math.round(prevTotalValue / prevCompletedTrades.length)
          : 0;

        const avgDealSizeChange = this.calculatePercentageChange(avgDealSize, prevAvgDealSize);

        // By category (from product)
        const categoryMap: Map<string, number> = new Map();
        for (const trade of completedTrades) {
          const product = trade.product as any;
          const category = product?.category || product?.productType || 'Uncategorized';
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          categoryMap.set(category, (categoryMap.get(category) || 0) + (price * quantity));
        }

        const byCategory: CategoryValue[] = Array.from(categoryMap.entries())
          .map(([category, value]) => ({ category, value: Math.round(value) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        // By incoterm
        const incotermMap: Map<string, { value: number; count: number }> = new Map();
        for (const trade of completedTrades) {
          const incoterm = trade.buyerIncoterms?.selectedIncoterm ||
            trade.sellerOfferedIncoterms?.selectedIncoterm ||
            'Unknown';
          const existing = incotermMap.get(incoterm) || { value: 0, count: 0 };
          const price = parseFloat(trade.buyerOfferedPrice?.toString() || trade.sellerOfferedPrice?.toString() || '0') || 0;
          const quantity = parseFloat(trade.quantity?.toString() || '1') || 1;
          existing.value += price * quantity;
          existing.count += 1;
          incotermMap.set(incoterm, existing);
        }

        const byIncoterm: IncotermUsage[] = Array.from(incotermMap.entries())
          .map(([incoterm, data]) => ({
            incoterm,
            value: Math.round(data.value),
            count: data.count,
          }))
          .sort((a, b) => b.value - a.value);

        return {
          valueTimeSeries,
          avgDealSize,
          avgDealSizeChange,
          byCategory,
          byIncoterm,
        };
      } catch (error) {
        this.logger.error('Error fetching financial analytics:', error);
        return this.getEmptyFinancialAnalytics();
      }
    }, CACHE_TTL);
  }

  private getEmptyFinancialAnalytics(): FinancialAnalytics {
    return {
      valueTimeSeries: [],
      avgDealSize: 0,
      avgDealSizeChange: 0,
      byCategory: [],
      byIncoterm: [],
    };
  }

  // ========================================================================
  // OPERATIONAL METRICS
  // ========================================================================

  async getOperationalMetrics(): Promise<OperationalMetrics> {
    const cacheKey = 'admin:analytics:operational';

    return this.cacheService.getOrSet(cacheKey, async () => {
      try {
        // KYC Backlog
        const companies = await this.companyModel.find({
          'kycDocuments.status': KycDocumentStatus.PENDING,
        }).lean();

        let totalPendingDocs = 0;
        let totalWaitDays = 0;

        for (const company of companies) {
          const pendingDocs = (company.kycDocuments || []).filter(
            (doc) => doc.status === KycDocumentStatus.PENDING,
          );
          for (const doc of pendingDocs) {
            totalPendingDocs++;
            const waitDays = (Date.now() - new Date(doc.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
            totalWaitDays += waitDays;
          }
        }

        const kycBacklog: KycBacklog = {
          pending: totalPendingDocs,
          avgWaitDays: totalPendingDocs > 0 ? Math.round((totalWaitDays / totalPendingDocs) * 10) / 10 : 0,
        };

        // Document processing time (for trade documents)
        const documentProcessing: DocumentProcessing = {
          avgHours: 0,
          byType: [
            { type: 'SCO', avgHours: 0 },
            { type: 'ICPO', avgHours: 0 },
            { type: 'SPA', avgHours: 0 },
            { type: 'Payment', avgHours: 0 },
            { type: 'BoL', avgHours: 0 },
          ],
        };

        // Calculate avg hours between document upload and status change
        // This is a simplified version - in production you'd track review timestamps
        const approvedDocs = await this.companyModel.find({
          'kycDocuments.status': KycDocumentStatus.APPROVED,
        }).lean();

        let totalProcessingHours = 0;
        let processedDocsCount = 0;

        for (const company of approvedDocs) {
          const approved = (company.kycDocuments || []).filter(
            (doc) => doc.status === KycDocumentStatus.APPROVED && doc.reviewedAt,
          );
          for (const doc of approved) {
            const hours = (new Date(doc.reviewedAt!).getTime() - new Date(doc.uploadedAt).getTime()) / (1000 * 60 * 60);
            totalProcessingHours += hours;
            processedDocsCount++;
          }
        }

        documentProcessing.avgHours = processedDocsCount > 0
          ? Math.round((totalProcessingHours / processedDocsCount) * 10) / 10
          : 0;

        // Stalled trades (stuck in a phase for more than 7 days)
        const stalledThreshold = 7;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - stalledThreshold);

        const stalledTrades = await this.tradeModel.countDocuments({
          tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
          lastPhaseChangeAt: { $lt: thresholdDate },
        });

        return {
          kycBacklog,
          documentProcessing,
          stalledTrades: {
            count: stalledTrades,
            threshold: stalledThreshold,
          },
        };
      } catch (error) {
        this.logger.error('Error fetching operational metrics:', error);
        return this.getEmptyOperationalMetrics();
      }
    }, CACHE_TTL);
  }

  private getEmptyOperationalMetrics(): OperationalMetrics {
    return {
      kycBacklog: { pending: 0, avgWaitDays: 0 },
      documentProcessing: { avgHours: 0, byType: [] },
      stalledTrades: { count: 0, threshold: 7 },
    };
  }

  // ========================================================================
  // CACHE INVALIDATION
  // ========================================================================

  async invalidateAnalyticsCache(): Promise<void> {
    // In a real implementation, you'd invalidate all admin analytics cache keys
    // For now, the cache will naturally expire after TTL
    this.logger.log('Analytics cache invalidation requested');
  }
}
