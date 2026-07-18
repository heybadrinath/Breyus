import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Import schemas - we'll use string model names since schemas are in different modules
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Company') private companyModel: Model<any>,
    @InjectModel('Trade') private tradeModel: Model<any>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('TradeDispute') private disputeModel: Model<any>,
  ) {}

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalUsersChange: number;
    activeTrades: number;
    activeTradesChange: number;
    totalCompanies: number;
    totalCompaniesChange: number;
    totalProducts: number;
    monthlyVolume: number;
    monthlyVolumeChange: number;
    pendingKyc: number;
    pendingDisputes: number;
    stalledTrades: number;
  }> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current counts
    const [
      totalUsers,
      usersLastMonth,
      totalCompanies,
      companiesLastMonth,
      activeTrades,
      activeTradesLastMonth,
      totalProducts,
      pendingKyc,
      stalledTrades,
      pendingDisputes,
    ] = await Promise.all([
      // Total users
      this.userModel.countDocuments().exec(),
      // Users created last month
      this.userModel
        .countDocuments({
          createdAt: { $gte: lastMonth, $lt: thisMonthStart },
        })
        .exec(),
      // Total companies
      this.companyModel.countDocuments().exec(),
      // Companies created last month
      this.companyModel
        .countDocuments({
          createdAt: { $gte: lastMonth, $lt: thisMonthStart },
        })
        .exec(),
      // Active trades (not completed or rejected)
      this.tradeModel
        .countDocuments({
          tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        })
        .exec(),
      // Active trades last month
      this.tradeModel
        .countDocuments({
          tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
          createdAt: { $gte: lastMonth, $lt: thisMonthStart },
        })
        .exec(),
      // Total products
      this.productModel.countDocuments().exec(),
      // Pending KYC (companies with unverified documents)
      this.companyModel
        .countDocuments({
          $or: [
            { isKycVerified: false },
            { 'kycDocuments.status': 'pending' },
          ],
        })
        .exec(),
      // Stalled trades (no activity for 7+ days)
      this.tradeModel
        .countDocuments({
          tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
          updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
        .exec(),
      // Pending disputes (open or under_review)
      this.disputeModel
        .countDocuments({
          status: { $in: ['open', 'under_review'] },
        })
        .exec(),
    ]);

    // Calculate monthly volume (sum of trade values completed this month)
    // Using buyerOfferedPrice as the price field with safe conversion
    const volumeAggregation = await this.tradeModel
      .aggregate([
        {
          $match: {
            tradePhase: 'COMPLETED',
            updatedAt: { $gte: thisMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  {
                    $convert: {
                      input: '$quantity',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  {
                    $convert: {
                      input: '$buyerOfferedPrice',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      ])
      .exec();

    const lastMonthVolumeAggregation = await this.tradeModel
      .aggregate([
        {
          $match: {
            tradePhase: 'COMPLETED',
            updatedAt: { $gte: lastMonth, $lt: thisMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  {
                    $convert: {
                      input: '$quantity',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  {
                    $convert: {
                      input: '$buyerOfferedPrice',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      ])
      .exec();

    const monthlyVolume = volumeAggregation[0]?.total || 0;
    const lastMonthVolume = lastMonthVolumeAggregation[0]?.total || 0;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Users created this month vs last month
    const usersThisMonth = await this.userModel
      .countDocuments({
        createdAt: { $gte: thisMonthStart },
      })
      .exec();

    // Get users two months ago for proper comparison
    const usersTwoMonthsAgo = await this.userModel
      .countDocuments({
        createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
      })
      .exec();

    return {
      totalUsers,
      totalUsersChange: calculateChange(usersThisMonth, usersLastMonth),
      activeTrades,
      activeTradesChange: calculateChange(
        activeTrades,
        activeTradesLastMonth || activeTrades,
      ),
      totalCompanies,
      totalCompaniesChange: calculateChange(
        await this.companyModel
          .countDocuments({ createdAt: { $gte: thisMonthStart } })
          .exec(),
        companiesLastMonth,
      ),
      totalProducts,
      monthlyVolume,
      monthlyVolumeChange: calculateChange(monthlyVolume, lastMonthVolume),
      pendingKyc,
      pendingDisputes,
      stalledTrades,
    };
  }

  async getPendingActions(): Promise<{
    kyc: { count: number; items: any[] };
    disputes: { count: number; items: any[] };
    stalledTrades: { count: number; items: any[] };
  }> {
    // Get pending KYC items - companies with kycDocuments in pending status
    const pendingKycCompanies = await this.companyModel
      .find({
        $or: [
          { 'kycDocuments.status': 'pending' },
          { isKycVerified: false, kycDocuments: { $exists: true, $ne: [] } },
        ],
      })
      .select('companyName primaryEmail createdAt kycDocuments')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    const pendingKycItems = pendingKycCompanies.map((company: any) => {
      const { primaryEmail, ...item } = company;
      return { ...item, email: primaryEmail };
    });

    // Get stalled trades (no activity for 7+ days)
    const stalledTradesRaw = await this.tradeModel
      .find({
        tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
      .select('_id tradePhase updatedAt quantity')
      .sort({ updatedAt: 1 })
      .limit(10)
      .exec();

    // Transform stalled trades to match frontend expected format
    const stalledTrades = stalledTradesRaw.map((trade: any) => ({
      _id: trade._id,
      tradeId: `TRD-${trade._id.toString().slice(-8).toUpperCase()}`,
      status: trade.tradePhase,
      updatedAt: trade.updatedAt,
    }));

    // Get open/under_review disputes (pending action required)
    const pendingDisputes = await this.disputeModel
      .find({
        status: { $in: ['open', 'under_review'] },
      })
      .select('_id raisedByEmail reason priority status createdAt')
      .sort({ priority: -1, createdAt: -1 }) // Urgent first, then by date
      .limit(10)
      .exec();

    // Transform disputes to match frontend expected format
    const disputes = pendingDisputes.map((dispute: any) => ({
      _id: dispute._id,
      raisedByEmail: dispute.raisedByEmail,
      reason: dispute.reason,
      priority: dispute.priority,
      status: dispute.status,
      createdAt: dispute.createdAt,
    }));

    return {
      kyc: {
        count: pendingKycItems.length,
        items: pendingKycItems,
      },
      disputes: {
        count: disputes.length,
        items: disputes,
      },
      stalledTrades: {
        count: stalledTrades.length,
        items: stalledTrades,
      },
    };
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    // Get recent trades
    const recentTrades = await this.tradeModel
      .find()
      .select('tradePhase negotiationStatus buyer seller createdAt updatedAt')
      .populate('buyer', 'email')
      .populate('seller', 'email')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return recentTrades.map((trade) => ({
      type: 'trade',
      id: trade._id,
      tradePhase: trade.tradePhase,
      status: trade.negotiationStatus,
      buyer: trade.buyer,
      seller: trade.seller,
      timestamp: trade.updatedAt || trade.createdAt,
    }));
  }

  async getTradesByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await this.tradeModel
      .aggregate([
        {
          $group: {
            _id: '$tradePhase',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
      ])
      .exec();

    return result;
  }

  async getUsersByRole(): Promise<{ role: string; count: number }[]> {
    const result = await this.userModel
      .aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ])
      .exec();

    return result;
  }

  async getTradeVolumeOverTime(
    days: number = 30,
  ): Promise<{ date: string; volume: number; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.tradeModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            volume: {
              $sum: {
                $multiply: [
                  {
                    $convert: {
                      input: '$quantity',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  {
                    $convert: {
                      input: '$buyerOfferedPrice',
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            date: '$_id',
            volume: 1,
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { date: 1 },
        },
      ])
      .exec();

    return result;
  }
}
