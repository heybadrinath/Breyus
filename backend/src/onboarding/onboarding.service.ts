import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  SendEmailOtpDto,
  VerifyEmailOtpDto,
  SetPasswordDto,
  continueOnboardingDto,
  Step2Dto,
  Step3Dto,
  Step4Dto,
  Step5Dto,
} from 'src/onboarding/dto/onboarding.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from 'src/company/company.schema';
import { User, UserSchema } from 'src/users/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { NotFoundError } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import * as jwt from 'jsonwebtoken';
import { response, Response } from 'express';
import { decode } from 'punycode';
import { GstService } from 'src/gst/gst.service';
import { MiscNotificationService } from 'src/notification/misc-notification.service';
import { ONBOARDING_PROGRESS } from './onboarding-progress';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(Company.name) private readonly companySchema: Model<Company>,
    @InjectModel(User.name) private readonly userSchema: Model<User>,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly gstService: GstService,
    @Inject(forwardRef(() => MiscNotificationService))
    private readonly miscNotificationService: MiscNotificationService,
  ) {}

  // step1 creating and onboarding the user

  async sendMailOtp(sendMailOtp: SendEmailOtpDto): Promise<string> {
    const { email } = sendMailOtp;
    try {
      const otp = this.mailService.generateOtp();
      await this.mailService.storeOtp(email, otp);
      await this.mailService.sendOtpEmail(email, otp);
      return 'Otp has been sent to your email';
    } catch (e) {
      await this.mailService.deleteOtp(email);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to send otp!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async ValidateMailOtp(verifyEmailOtpDto: VerifyEmailOtpDto): Promise<any> {
    const { email, otp } = verifyEmailOtpDto;

    if (!(await this.mailService.validateOtp(email, otp))) {
      throw new HttpException(
        'Invalid or expired OTP. Please check your code and try again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userSchema
      .findOne({ mail: email })
      .populate('company', 'isOnboardingCompleted')
      .exec();

    if (!user) {
      const onboardingToken = this.authService.generateOnboardingToken({
        mail: email,
      });
      return { token: onboardingToken, onboardingStatus: 'false' };
    }

    if (
      user.company &&
      typeof user.company === 'object' &&
      'isOnboardingCompleted' in user.company
    ) {
      const companyOnboardingStatus = (user.company as any)
        .isOnboardingCompleted;

      // Re-registration cleanup: If onboarding was never completed, delete the orphan
      // records and allow the user to start fresh (instead of being stuck)
      if (!companyOnboardingStatus) {
        console.log(
          `[Orphan Cleanup] Deleting incomplete onboarding for: ${email}`,
        );
        try {
          const companyId = (user.company as any)._id;
          await this.companySchema.findByIdAndDelete(companyId);
          await this.userSchema.findByIdAndDelete(user._id);
          console.log(
            `[Orphan Cleanup] Deleted company ${companyId} and user ${user._id}`,
          );

          // Return fresh start token (same as new user)
          const onboardingToken = this.authService.generateOnboardingToken({
            mail: email,
          });
          return { token: onboardingToken, onboardingStatus: 'false' };
        } catch (cleanupError) {
          console.error('[Orphan Cleanup] Failed to cleanup:', cleanupError);
          // Continue with existing flow if cleanup fails
        }
      }

      const onboardingToken = this.authService.generateOnboardingToken({
        userId: user._id.toString(),
      });
      return {
        token: onboardingToken,
        onboardingStatus: companyOnboardingStatus,
      };
    }

    // Edge case: User exists but company is null/undefined or not properly populated
    // This can happen if there's data inconsistency. Clean up and allow fresh start.
    console.log(
      `[Data Cleanup] User exists without valid company for: ${email}`,
    );
    try {
      await this.userSchema.findByIdAndDelete(user._id);
      console.log(`[Data Cleanup] Deleted orphan user ${user._id}`);
    } catch (cleanupError) {
      console.error(
        '[Data Cleanup] Failed to cleanup orphan user:',
        cleanupError,
      );
    }

    // Return fresh start token
    const onboardingToken = this.authService.generateOnboardingToken({
      mail: email,
    });
    return { token: onboardingToken, onboardingStatus: 'false' };
  }

  async SetPassword(
    setPasswordDto: SetPasswordDto,
    onboardingToken,
  ): Promise<string> {
    const { setPassword, confirmPassword } = setPasswordDto;

    // verify if password match
    if (setPassword !== confirmPassword) {
      throw new HttpException(
        "Set passwords and confirm passwords don't match",
        HttpStatus.BAD_REQUEST,
      );
    }

    // decode the jwt token
    let decodeToken;
    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    try {
      decodeToken = jwt.verify(onboardingToken, jwtSecret);
    } catch (e) {
      throw new HttpException(
        'Invalid or expired onboarding token',
        HttpStatus.BAD_REQUEST,
      );
    }

    // extract user object id from decoded token
    const mail = decodeToken.mail;
    if (!mail) {
      throw new HttpException(
        'Please Verify your email through otp first!',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if user already exists
    const existingUser = await this.userSchema.findOne({ mail: mail });
    if (existingUser) {
      throw new HttpException(
        'Account already exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(setPassword, 10);

    // create company empty database with TTL expiry for orphan cleanup
    let savedCompany;
    try {
      // Set expiry to 7 days from now - MongoDB TTL index will auto-delete
      // if onboarding is not completed (expiry cleared on completion)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const company = new this.companySchema({
        onboardingExpiresAt: expiryDate,
        onboardingProgress: ONBOARDING_PROGRESS.ACCOUNT_CREATED,
      });
      savedCompany = await company.save();
    } catch (e) {
      throw new HttpException(
        'Unable to create Companies Database please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // create an user database
    let savedUser;
    try {
      const User = new this.userSchema({
        mail: mail,
        password: hashedPassword,
        company: savedCompany._id,
      });
      savedUser = await User.save();
    } catch (e) {
      // Rollback: Delete the orphan company record to maintain data integrity
      console.error('User creation failed, rolling back company:', e.message);
      try {
        await this.companySchema.findByIdAndDelete(savedCompany._id);
        console.log('Orphan company deleted successfully:', savedCompany._id);
      } catch (rollbackError) {
        console.error('Failed to delete orphan company:', rollbackError);
      }
      throw new HttpException(
        `Unable to create User: ${e.message || 'please try again later'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const JwtToken = this.authService.generateAccountToken(
      savedUser._id,
      savedCompany._id,
    );
    return JwtToken;
  }

  async continueOnboarding(continueOnboardingDto, onboardingToken: string) {
    const { password } = continueOnboardingDto;

    try {
      const jwtSecret = process.env.JWT_SECRET_KEY;
      if (!jwtSecret) {
        throw new InternalServerErrorException(
          'JWT secret key is not defined in environment variables',
        );
      }
      const decodeToken = jwt.verify(onboardingToken, jwtSecret);
      if (
        typeof decodeToken !== 'object' ||
        decodeToken === null ||
        !('userId' in decodeToken)
      ) {
        throw new HttpException(
          'Invalid token payload',
          HttpStatus.BAD_REQUEST,
        );
      }
      const userId = decodeToken.userId;

      const user = await this.userSchema.findById(userId).populate('company');

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new HttpException(
          'Incorrect password. Please try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const JwtToken = this.authService.generateAccountToken(
        userId as string,
        user.company._id as unknown as string,
      );
      return JwtToken;
    } catch (e) {
      // Re-throw HttpException as-is, otherwise wrap the error
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        e.message || 'Failed to continue onboarding.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // step 2 logic
  async step2(step2Dto: Step2Dto, AccountToken: string) {
    const { companyName, companyAddress, country, companyMobile, taxId } =
      step2Dto;

    const jwtSecret = process.env.JWT_SECRET_KEY;
    let payload;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    try {
      payload = jwt.verify(AccountToken, jwtSecret);
    } catch (e) {
      throw new HttpException(
        'Unauthorised, please verify again!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = payload.userId;

    const user = await this.userSchema
      .findById(userId)
      .populate('company', '_id');

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.company || !user.company._id) {
      throw new HttpException(
        'Company not found for user',
        HttpStatus.NOT_FOUND,
      );
    }

    // GST Verification for Indian companies
    let gstVerified = false;
    let gstVerificationData: {
      legalName: string;
      tradeName?: string;
      status: string;
      registrationDate?: string;
      stateJurisdiction?: string;
    } | null = null;
    let gstPendingManualReview = false;
    let gstVerificationMessage: string | null = null;

    if (country === 'India') {
      // 1. Validate GST format
      const formatResult = this.gstService.validateGSTFormat(taxId);
      if (!formatResult.valid) {
        throw new HttpException(
          `Invalid GST format: ${formatResult.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      try {
        // 2. Verify with Cashfree API
        const verification = await this.gstService.verifyGST(taxId);

        if (verification.status !== 'VALID') {
          throw new HttpException(
            'GST number not found in government records. Please check and try again.',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (verification.statusOfGstin !== 'Active') {
          throw new HttpException(
            `GST registration is ${verification.statusOfGstin}. Only active GST numbers are accepted.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        // 3. Verify company name matches
        const nameMatches = this.gstService.matchCompanyName(
          companyName,
          verification.legalName,
          verification.tradeName,
        );

        if (!nameMatches) {
          throw new HttpException(
            `Company name does not match GST records. GST registered name: "${verification.legalName}"${verification.tradeName ? ` (Trade name: "${verification.tradeName}")` : ''}. Please ensure the company name matches the GST registration.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        gstVerified = true;
        gstVerificationData = {
          legalName: verification.legalName,
          tradeName: verification.tradeName,
          status: verification.statusOfGstin,
          registrationDate: verification.registrationDate,
          stateJurisdiction: verification.stateJurisdiction,
        };
        gstVerificationMessage = 'GST verified successfully';
      } catch (error) {
        if (error instanceof HttpException) {
          // Only re-throw BAD_REQUEST validation errors (invalid GST, name mismatch, etc.)
          // SERVICE_UNAVAILABLE means API not configured - allow with manual review
          if (error.getStatus() === HttpStatus.BAD_REQUEST) {
            throw error;
          }
          // SERVICE_UNAVAILABLE or other non-validation errors - proceed with manual review
          console.warn(
            '[GST Verification] Service unavailable, flagging for manual review:',
            error.message,
          );
        }
        // API failure or service not configured - allow with manual review flag
        console.error('[GST Verification] API error:', error.message);
        gstPendingManualReview = true;
        gstVerificationMessage =
          'GST verification pending manual review due to service unavailability';
      }
    }

    try {
      const companyId = user.company._id;
      const updateData: any = {
        companyName,
        companyAddress,
        country,
        companyMobile,
        taxId: taxId.toUpperCase(), // Normalize GSTIN/Tax ID to uppercase
      };

      // Add GST fields only for Indian companies
      if (country === 'India') {
        updateData.gstVerified = gstVerified;
        updateData.gstPendingManualReview = gstPendingManualReview;
        if (gstVerified) {
          updateData.gstVerifiedAt = new Date();
          updateData.gstVerificationData = gstVerificationData;
        }
      }

      const updateCompany = await this.companySchema.findByIdAndUpdate(
        companyId,
        {
          $set: updateData,
          $max: {
            onboardingProgress: ONBOARDING_PROGRESS.COMPANY_DETAILS,
          },
        },
        { new: true },
      );

      if (!updateCompany) {
        throw new HttpException(
          'Company not found or update failed',
          HttpStatus.NOT_FOUND,
        );
      }

      // Return company with verification message
      return {
        ...updateCompany.toObject(),
        gstVerificationMessage,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle MongoDB duplicate key error for taxId
      if (
        error.code === 11000 ||
        (error.name === 'MongoServerError' &&
          error.message?.includes('duplicate key'))
      ) {
        const duplicateField = error.keyPattern
          ? Object.keys(error.keyPattern)[0]
          : 'taxId';
        if (duplicateField === 'taxId') {
          throw new HttpException(
            'This Tax ID / GST Number is already registered with another company. Please check and enter a valid Tax ID.',
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException(
          `A company with this ${duplicateField} already exists.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      console.error('[Onboarding Step2] Error updating company:', error);
      throw new HttpException(
        'Internal server error while updating company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // step3 logic
  async step3(step3Dto: Step3Dto, AccountToken: string) {
    const { mainLineBusiness, meanMonthlyRevenue } = step3Dto;

    const jwtSecret = process.env.JWT_SECRET_KEY;
    let payload;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    try {
      payload = jwt.verify(AccountToken, jwtSecret);
    } catch (e) {
      throw new HttpException(
        'Unauthorised, please verify again!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = payload.userId;

    const user = await this.userSchema
      .findById(userId)
      .populate('company', '_id');

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.company || !user.company._id) {
      throw new HttpException(
        'Company not found for user',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const companyId = user.company._id;
      const updateCompany = await this.companySchema.findByIdAndUpdate(
        companyId,
        {
          $set: {
            mainLineBusiness,
            meanMonthlyRevenue,
          },
          $max: {
            onboardingProgress: ONBOARDING_PROGRESS.BUSINESS_DETAILS,
          },
        },
        { new: true },
      );

      if (!updateCompany) {
        throw new HttpException(
          'Company not found or update failed',
          HttpStatus.NOT_FOUND,
        );
      }

      return updateCompany;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('[Onboarding Step3] Error updating company:', error);
      throw new HttpException(
        'Internal server error while updating company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // step 4
  async step4(step4Dto: Step4Dto, AccountToken: string) {
    const { websiteUrl, founderName, exportedBefore, referrel } = step4Dto;

    const jwtSecret = process.env.JWT_SECRET_KEY;
    let payload;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    try {
      payload = jwt.verify(AccountToken, jwtSecret);
    } catch (e) {
      throw new HttpException(
        'Unauthorised, please verify again!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = payload.userId;

    const user = await this.userSchema
      .findById(userId)
      .populate('company', '_id');

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.company || !user.company._id) {
      throw new HttpException(
        'Company not found for user',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const companyId = user.company._id;
      const updateCompany = await this.companySchema.findByIdAndUpdate(
        companyId,
        {
          $set: {
            websiteUrl,
            founderName,
            exportedBefore,
            referrel,
          },
          $max: {
            onboardingProgress: ONBOARDING_PROGRESS.COMPANY_PROFILE,
          },
        },
        { new: true },
      );

      if (!updateCompany) {
        throw new HttpException(
          'Company not found or update failed',
          HttpStatus.NOT_FOUND,
        );
      }

      return updateCompany;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('[Onboarding Step4] Error updating company:', error);
      throw new HttpException(
        'Internal server error while updating company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // step 5
  async step5(step5Dto: Step5Dto, AccountToken: string) {
    const { role } = step5Dto;

    const jwtSecret = process.env.JWT_SECRET_KEY;
    let payload;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    try {
      payload = jwt.verify(AccountToken, jwtSecret);
    } catch (e) {
      throw new HttpException(
        'Unauthorised, please verify again!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = payload.userId;

    const user = await this.userSchema
      .findById(userId)
      .populate('company', '_id');

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.company || !user.company._id) {
      throw new HttpException(
        'Company not found for user',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const companyId = user.company._id;
      const updateCompany = await this.companySchema.findByIdAndUpdate(
        companyId,
        {
          $set: {
            role,
            isOnboardingCompleted: true,
            onboardingProgress: ONBOARDING_PROGRESS.COMPLETED,
          },
          // Clear TTL expiry - company is now permanent (onboarding completed)
          $unset: { onboardingExpiresAt: 1 },
        },
        { new: true },
      );

      if (!updateCompany) {
        throw new HttpException(
          'Company not found or update failed',
          HttpStatus.NOT_FOUND,
        );
      }

      // Send welcome email and onboarding complete notification (async, non-blocking)
      setImmediate(async () => {
        try {
          // Map Role enum to lowercase 'buyer' | 'seller' for notification service
          // 'Seller and Buyer' is treated as 'seller' for email purposes
          const normalizedRole: 'buyer' | 'seller' =
            role === 'Buyer' ? 'buyer' : 'seller';

          // Send comprehensive welcome email
          await this.miscNotificationService.sendWelcomeEmail(
            userId,
            user.mail,
            companyId.toString(),
            normalizedRole,
          );

          // Send onboarding complete notification
          await this.miscNotificationService.sendOnboardingCompleteNotification(
            userId,
            user.mail,
            updateCompany.companyName || 'Your Company',
            normalizedRole,
          );
        } catch (notificationError) {
          console.error(
            '[Onboarding Step5] Failed to send notifications:',
            notificationError,
          );
          // Don't throw - notification failure shouldn't block onboarding
        }
      });

      return updateCompany;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('[Onboarding Step5] Error updating company:', error);
      throw new HttpException(
        'Internal server error while updating company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchOnboardingDetails(token: string): Promise<any> {
    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret key is not defined in environment variables',
      );
    }
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.userId;

    const user = await this.userSchema
      .findById(userId)
      .populate('company')
      .exec();

    if (!user || !user.company) {
      throw new NotFoundError('User or company not found');
    }

    return user.company;
  }
}
