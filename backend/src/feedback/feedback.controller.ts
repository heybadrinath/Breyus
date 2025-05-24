import { 
  Controller, Get, Post, Body, Param, 
  UseGuards, Request, Logger, BadRequestException 
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);
  
  constructor(private readonly feedbackService: FeedbackService) {}
  
  @UseGuards(JwtAuthGuard)
  @Get('products/:productId')
  async getProductFeedback(@Param('productId') productId: string) {
    this.logger.log(`Getting feedback for product ${productId}`);
    return this.feedbackService.getProductFeedback(productId);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Get('seller/products')
  async getSellerProductsFeedback(@Request() req) {
    const sellerId = req.user.id;
    this.logger.log(`Getting feedback for all products of seller ${sellerId}`);
    return this.feedbackService.getSellerProductsFeedback(sellerId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/review')
  async addReview(
    @Param('productId') productId: string,
    @Body() reviewData: { rating: number; content: string; images?: string[] },
    @Request() req
  ) {
    const { rating, content, images = [] } = reviewData;
    const userId = req.user.id;
    const userName = req.user.name || 'Anonymous';
    const userAvatar = req.user.avatar;
    
    this.logger.log(`Adding review for product ${productId} by user ${userId}`);
    
    return this.feedbackService.addReview(
      productId, 
      userId, 
      userName, 
      userAvatar, 
      rating, 
      content, 
      images
    );
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @Post('reviews/:reviewId/reply')
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Body() replyData: { reply: string },
    @Request() req
  ) {
    const { reply } = replyData;
    const sellerId = req.user.id;
    
    if (!reply) {
      throw new BadRequestException('Reply content is required');
    }
    
    this.logger.log(`Adding reply to review ${reviewId} by seller ${sellerId}`);
    
    return this.feedbackService.replyToReview(reviewId, sellerId, reply);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('reviews/:reviewId/vote')
  async voteOnReview(
    @Param('reviewId') reviewId: string,
    @Body() voteData: { voteType: 'helpful' | 'not_helpful' },
    @Request() req
  ) {
    const { voteType } = voteData;
    const userId = req.user.id;
    
    if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
      throw new BadRequestException('Valid vote type (helpful or not_helpful) is required');
    }
    
    this.logger.log(`Voting on review ${reviewId} by user ${userId} as ${voteType}`);
    
    return this.feedbackService.voteOnReview(reviewId, userId, voteType);
  }
} 