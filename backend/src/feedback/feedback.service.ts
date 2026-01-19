import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackType } from './feedback.schema';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/create-feedback.dto';
import { Trade } from '../trade/schema/trade.schema';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    private readonly authService: AuthService,
  ) {}

  private extractUserId(accountToken: string): string {
    const decodedToken = this.authService.validateAccountToken(accountToken);
    const userId = (decodedToken as any).userId;

    if (!userId) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    return userId;
  }

  async createFeedback(accountToken: string, createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const userId = this.extractUserId(accountToken);
    const { tradeId, feedbackType, rating, comment, tags, details } = createFeedbackDto;

    // Validate the trade exists
    const trade = await this.tradeModel.findById(tradeId).exec();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Verify the user is part of the trade
    const userObjectId = new Types.ObjectId(userId);
    const isBuyer = trade.buyer.equals(userObjectId);
    const isSeller = trade.seller.equals(userObjectId);

    if (!isBuyer && !isSeller) {
      throw new BadRequestException('You are not part of this trade');
    }

    if (trade.tradePhase !== 'COMPLETED') {
      throw new BadRequestException('Feedback can only be submitted after trade completion');
    }

    // Only buyers can leave seller/delivery/product feedback
    if (feedbackType === 'seller' || feedbackType === 'delivery' || feedbackType === 'product') {
      if (!isBuyer) {
        throw new BadRequestException('Only buyers can leave this type of feedback');
      }
    }

    // Check if feedback already exists for this trade and type
    const existingFeedback = await this.feedbackModel.findOne({
      trade: new Types.ObjectId(tradeId),
      reviewer: userObjectId,
      feedbackType,
    }).exec();

    if (existingFeedback) {
      throw new BadRequestException(`You have already submitted ${feedbackType} feedback for this trade`);
    }

    // Determine the reviewee (the person being reviewed)
    let reviewee: Types.ObjectId;
    if (feedbackType === 'seller') {
      reviewee = trade.seller;
    } else {
      // For delivery and product feedback, reviewee is also the seller
      reviewee = trade.seller;
    }

    const productId = (trade.product as any)?._id || trade.product;

    const feedback = new this.feedbackModel({
      trade: new Types.ObjectId(tradeId),
      product: productId ? new Types.ObjectId(productId) : undefined,
      reviewer: userObjectId,
      reviewee,
      feedbackType,
      rating,
      comment: comment || '',
      tags: tags || [],
      details: details || {},
    });

    return feedback.save();
  }

  async getFeedbackByTrade(tradeId: string): Promise<Feedback[]> {
    return this.feedbackModel
      .find({ trade: new Types.ObjectId(tradeId) })
      .populate('reviewer', 'mail')
      .populate('reviewee', 'mail')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFeedbackForUser(userId: string): Promise<{
    feedbacks: Feedback[];
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
  }> {
    const feedbacks = await this.feedbackModel
      .find({ reviewee: new Types.ObjectId(userId) })
      .populate('reviewer', 'mail')
      .populate('product', 'name price currency productImages')
      .populate({ path: 'trade', select: 'product', populate: { path: 'product', select: 'name price currency productImages' } })
      .sort({ createdAt: -1 })
      .exec();

    // Calculate average rating and breakdown
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    feedbacks.forEach((feedback) => {
      ratingBreakdown[feedback.rating]++;
      totalRating += feedback.rating;
    });

    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;

    return {
      feedbacks,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: feedbacks.length,
      ratingBreakdown,
    };
  }

  async getFeedbackByType(userId: string, feedbackType: FeedbackType): Promise<Feedback[]> {
    return this.feedbackModel
      .find({
        reviewee: new Types.ObjectId(userId),
        feedbackType,
      })
      .populate('reviewer', 'mail')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAverageRatingForUser(userId: string): Promise<{ average: number; count: number }> {
    const result = await this.feedbackModel.aggregate([
      { $match: { reviewee: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { average: 0, count: 0 };
    }

    return {
      average: Math.round(result[0].averageRating * 10) / 10,
      count: result[0].count,
    };
  }

  async hasUserLeftFeedback(
    accountToken: string,
    tradeId: string,
    feedbackType: FeedbackType,
  ): Promise<boolean> {
    const userId = this.extractUserId(accountToken);

    const feedback = await this.feedbackModel.findOne({
      reviewer: new Types.ObjectId(userId),
      trade: new Types.ObjectId(tradeId),
      feedbackType,
    }).exec();

    return !!feedback;
  }

  async getMyFeedbackForTrade(
    accountToken: string,
    tradeId: string,
    feedbackType: FeedbackType,
  ): Promise<Feedback | null> {
    const userId = this.extractUserId(accountToken);

    return this.feedbackModel
      .findOne({
        reviewer: new Types.ObjectId(userId),
        trade: new Types.ObjectId(tradeId),
        feedbackType,
      })
      .populate('product', 'name price currency productImages')
      .exec();
  }

  async updateFeedback(
    accountToken: string,
    tradeId: string,
    feedbackType: FeedbackType,
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<Feedback> {
    const userId = this.extractUserId(accountToken);
    const { rating, comment, tags, details } = updateFeedbackDto;

    const trade = await this.tradeModel.findById(tradeId).exec();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const isBuyer = trade.buyer.equals(userObjectId);
    const isSeller = trade.seller.equals(userObjectId);

    if (!isBuyer && !isSeller) {
      throw new BadRequestException('You are not part of this trade');
    }

    if (trade.tradePhase !== 'COMPLETED') {
      throw new BadRequestException('Feedback can only be updated after trade completion');
    }

    if (!isBuyer) {
      throw new BadRequestException('Only buyers can update feedback');
    }

    const feedback = await this.feedbackModel.findOne({
      trade: new Types.ObjectId(tradeId),
      reviewer: userObjectId,
      feedbackType,
    }).exec();

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    feedback.rating = rating;
    feedback.comment = comment || '';
    if (tags) {
      feedback.tags = tags;
    }
    if (details) {
      feedback.details = details;
    }

    if (!feedback.product && trade.product) {
      const productId = (trade.product as any)?._id || trade.product;
      if (productId) {
        feedback.product = new Types.ObjectId(productId);
      }
    }

    return feedback.save();
  }

  async getSellerFeedbackDashboard(accountToken: string): Promise<{
    summary: {
      totalReviews: number;
      averageRating: number;
      ratingBreakdown: Record<number, number>;
      byType: Record<FeedbackType, { count: number; averageRating: number }>;
    };
    productBreakdown: Array<{
      product: {
        _id: Types.ObjectId;
        name?: string;
        price?: string;
        currency?: string;
        productImages?: string[];
      };
      totalReviews: number;
      averageRating: number;
      ratingBreakdown: Record<number, number>;
      latestFeedbackAt?: Date;
    }>;
    recentFeedback: Feedback[];
  }> {
    const userId = this.extractUserId(accountToken);
    const userObjectId = new Types.ObjectId(userId);

    const feedbacks = await this.feedbackModel
      .find({ reviewee: userObjectId })
      .populate('reviewer', 'mail')
      .populate('product', 'name price currency productImages')
      .populate({ path: 'trade', select: 'product', populate: { path: 'product', select: 'name price currency productImages' } })
      .sort({ createdAt: -1 })
      .exec();

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byType: Record<FeedbackType, { count: number; averageRating: number }> = {
      seller: { count: 0, averageRating: 0 },
      delivery: { count: 0, averageRating: 0 },
      product: { count: 0, averageRating: 0 },
    };
    const byTypeTotals: Record<FeedbackType, number> = { seller: 0, delivery: 0, product: 0 };

    let totalRating = 0;
    feedbacks.forEach((feedback) => {
      ratingBreakdown[feedback.rating] = (ratingBreakdown[feedback.rating] || 0) + 1;
      totalRating += feedback.rating;

      const type = feedback.feedbackType;
      byType[type].count += 1;
      byTypeTotals[type] += feedback.rating;
    });

    (Object.keys(byType) as FeedbackType[]).forEach((type) => {
      byType[type].averageRating = byType[type].count > 0
        ? Math.round((byTypeTotals[type] / byType[type].count) * 10) / 10
        : 0;
    });

    const productMap = new Map<string, {
      product: any;
      totalReviews: number;
      totalRating: number;
      ratingBreakdown: Record<number, number>;
      latestFeedbackAt?: Date;
    }>();

    feedbacks
      .filter((feedback) => feedback.feedbackType === 'product')
      .forEach((feedback) => {
        const populatedProduct = (feedback as any).product || (feedback as any).trade?.product;
        if (!populatedProduct) return;

        const productId = populatedProduct._id?.toString?.() || populatedProduct.toString?.();
        if (!productId) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: populatedProduct,
            totalReviews: 0,
            totalRating: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            latestFeedbackAt: feedback.createdAt,
          });
        }

        const entry = productMap.get(productId)!;
        entry.totalReviews += 1;
        entry.totalRating += feedback.rating;
        entry.ratingBreakdown[feedback.rating] = (entry.ratingBreakdown[feedback.rating] || 0) + 1;
        if (!entry.latestFeedbackAt || feedback.createdAt > entry.latestFeedbackAt) {
          entry.latestFeedbackAt = feedback.createdAt;
        }
      });

    const productBreakdown = Array.from(productMap.values()).map((entry) => ({
      product: entry.product,
      totalReviews: entry.totalReviews,
      averageRating: entry.totalReviews > 0
        ? Math.round((entry.totalRating / entry.totalReviews) * 10) / 10
        : 0,
      ratingBreakdown: entry.ratingBreakdown,
      latestFeedbackAt: entry.latestFeedbackAt,
    }));

    return {
      summary: {
        totalReviews: feedbacks.length,
        averageRating: feedbacks.length > 0 ? Math.round((totalRating / feedbacks.length) * 10) / 10 : 0,
        ratingBreakdown,
        byType,
      },
      productBreakdown: productBreakdown.sort((a, b) => b.averageRating - a.averageRating),
      recentFeedback: feedbacks.slice(0, 10),
    };
  }
}
