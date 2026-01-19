import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackType } from './feedback.schema';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const feedback = await this.feedbackService.createFeedback(
        accountToken,
        createFeedbackDto,
      );

      return response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Feedback submitted successfully',
        data: feedback,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('trade/:tradeId')
  async getFeedbackByTrade(
    @Param('tradeId') tradeId: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const feedbacks = await this.feedbackService.getFeedbackByTrade(tradeId);

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Feedback retrieved successfully',
        data: feedbacks,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('user/:userId')
  async getFeedbackForUser(
    @Param('userId') userId: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.feedbackService.getFeedbackForUser(userId);

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'User feedback retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('user/:userId/type/:feedbackType')
  async getFeedbackByType(
    @Param('userId') userId: string,
    @Param('feedbackType') feedbackType: FeedbackType,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const feedbacks = await this.feedbackService.getFeedbackByType(
        userId,
        feedbackType,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Feedback by type retrieved successfully',
        data: feedbacks,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('my/:tradeId/:feedbackType')
  async getMyFeedback(
    @Param('tradeId') tradeId: string,
    @Param('feedbackType') feedbackType: FeedbackType,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const feedback = await this.feedbackService.getMyFeedbackForTrade(
        accountToken,
        tradeId,
        feedbackType,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Feedback retrieved successfully',
        data: feedback,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Put('my/:tradeId/:feedbackType')
  async updateFeedback(
    @Param('tradeId') tradeId: string,
    @Param('feedbackType') feedbackType: FeedbackType,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const feedback = await this.feedbackService.updateFeedback(
        accountToken,
        tradeId,
        feedbackType,
        updateFeedbackDto,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Feedback updated successfully',
        data: feedback,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('seller/dashboard')
  async getSellerDashboard(@Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.feedbackService.getSellerFeedbackDashboard(
        accountToken,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Seller feedback dashboard retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('user/:userId/rating')
  async getAverageRating(
    @Param('userId') userId: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.feedbackService.getAverageRatingForUser(userId);

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Average rating retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('check/:tradeId/:feedbackType')
  async hasUserLeftFeedback(
    @Param('tradeId') tradeId: string,
    @Param('feedbackType') feedbackType: FeedbackType,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const hasLeft = await this.feedbackService.hasUserLeftFeedback(
        accountToken,
        tradeId,
        feedbackType,
      );

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Feedback check completed',
        data: { hasLeftFeedback: hasLeft },
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }
}
