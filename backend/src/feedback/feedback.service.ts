import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackType } from './feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
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
    const { tradeId, feedbackType, rating, comment } = createFeedbackDto;

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

    const feedback = new this.feedbackModel({
      trade: new Types.ObjectId(tradeId),
      reviewer: userObjectId,
      reviewee,
      feedbackType,
      rating,
      comment: comment || '',
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
      .populate('trade', 'product')
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
}
