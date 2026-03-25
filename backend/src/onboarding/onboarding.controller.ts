import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Session,
  Headers,
  Res,
  Header,
} from '@nestjs/common';
import {
  SendEmailOtpDto,
  VerifyEmailOtpDto,
  continueOnboardingDto,
  SetPasswordDto,
  Step2Dto,
  Step3Dto,
  Step4Dto,
  Step5Dto,
} from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';
import { AuthService } from 'src/auth/auth.service';
import { Response } from 'express';

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
  ) {}

  // Endpoint to send OTP email
  @Post('send-otp')
  async sendOtp(@Body() sendEmailOtpDto: SendEmailOtpDto): Promise<string> {
    try {
      const response =
        await this.onboardingService.sendMailOtp(sendEmailOtpDto);
      return response as string;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to send OTP. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint to verify OTP and generate onboarding token
  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyEmailOtpDto: VerifyEmailOtpDto,
  ): Promise<string> {
    try {
      const token =
        await this.onboardingService.ValidateMailOtp(verifyEmailOtpDto);
      return token; // return the onboarding token
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Invalid or expired OTP.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('validate-token')
  async verifyOnboardingToken(@Headers('authorization') token: string) {
    try {
      return await this.authService.verifyOnboardingToken(token);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Endpoint to set a password after OTP verification
  @Post('set-password')
  async setPassword(
    @Body() setPasswordDto: SetPasswordDto,
    @Headers('authorization') token: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.SetPassword(
        setPasswordDto,
        token,
      );
      await response
        .status(HttpStatus.OK)
        .json({ message: 'Onboarding continued successfully', data: result });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to set password.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint that validate the jwt token and return the payload if.e userId
  @Post('validate-account-token')
  async validateAccountToken(
    @Headers('authorization') token: string,
  ): Promise<string> {
    try {
      return await this.authService.verifyAccountToken(token);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Endpoint to continue onboarding (after setting the password)
  @Post('continue-onboarding')
  async continueOnboarding(
    @Body() continueOnboardingDto: continueOnboardingDto,
    @Headers('authorization') onBoardingToken: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.continueOnboarding(
        continueOnboardingDto,
        onBoardingToken,
      );

      await response
        .status(HttpStatus.OK)
        .json({ message: 'Onboarding continued successfully', data: result });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to verify password.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // step 2 endpoint
  @Post('step-2')
  async step2(
    @Body() step2dto: Step2Dto,
    @Res() response: Response,
    @Headers('Authorization') AccountToken: string,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.step2(step2dto, AccountToken);
      await response
        .status(HttpStatus.OK)
        .json({ message: 'Step 2 completed successfully', data: result });
      // todo update the progress to 2 in database
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // step 3 endpoint
  @Post('step-3')
  async step3(
    @Body() step3dto: Step3Dto,
    @Res() response: Response,
    @Headers('Authorization') AccountToken: string,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.step3(step3dto, AccountToken);
      await response
        .status(HttpStatus.OK)
        .json({ message: 'Step 3 completed successfully', data: result });
      // todo update the progress to 3 in database
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // step 4 endpoint
  @Post('step-4')
  async step4(
    @Body() step4dto: Step4Dto,
    @Res() response: Response,
    @Headers('Authorization') AccountToken: string,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.step4(step4dto, AccountToken);
      await response
        .status(HttpStatus.OK)
        .json({ message: 'Step 4 completed successfully', data: result });
      // todo update the progress to 4 in database
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // step 5 endpoint
  @Post('step-5')
  async step5(
    @Body() step5dto: Step5Dto,
    @Res() response: Response,
    @Headers('Authorization') AccountToken: string,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.step5(step5dto, AccountToken);
      await response
        .status(HttpStatus.OK)
        .json({ message: 'Step 5 completed successfully', data: result });
      // todo update the progress to 4 in database
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint to get the onboarding progress and details
  @Post('get-onboarding-progress-details')
  async getOnboardingProgress(
    @Headers('Authorization') token: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const result = await this.onboardingService.fetchOnboardingDetails(token);
      await response.status(HttpStatus.OK).json({
        message: 'Onboarding progress retrieved successfully',
        company: result,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
