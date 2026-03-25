import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { BlogUser } from '../schemas/blog-user.schema';
import { BlogSession, DeviceInfo } from '../schemas/blog-session.schema';
import { User } from '../../users/user.schema';
import { Company } from '../../company/company.schema';
import { MailService } from '../../mail/mail.service';
import {
  BlogSignupDto,
  BreyusMemberOtpRequestDto,
  BreyusMemberOtpVerifyDto,
} from './dto/blog-signup.dto';
import {
  BlogLoginDto,
  BlogForgotPasswordDto,
  BlogResetPasswordDto,
  BlogChangePasswordDto,
} from './dto/blog-login.dto';

/**
 * BlogAuthService - Handles all blog portal authentication
 *
 * Supports two user types:
 * 1. Blog-only users: Standard email/password signup
 * 2. Breyus members: OTP-based SSO with password sync
 *
 * Key features:
 * - Separate session management from main Breyus app
 * - Auto-creation of blog users for Breyus members
 * - Password sync from Breyus at first login
 * - Session tokens with SHA256 hashing
 */
@Injectable()
export class BlogAuthService {
  private readonly logger = new Logger(BlogAuthService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly SESSION_EXPIRY_DAYS = 30;

  constructor(
    @InjectModel(BlogUser.name)
    private blogUserModel: Model<BlogUser>,
    @InjectModel(BlogSession.name)
    private blogSessionModel: Model<BlogSession>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Company.name)
    private companyModel: Model<Company>,
    private mailService: MailService,
  ) {}

  /**
   * Blog-only user signup
   * Creates a new blog user with password authentication
   */
  async signup(dto: BlogSignupDto): Promise<{ user: BlogUser; token: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if email already exists in blog users
    const existingBlogUser = await this.blogUserModel.findOne({
      email: normalizedEmail,
    });

    if (existingBlogUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if email exists in Breyus users (suggest using Breyus login)
    const breyusUser = await this.userModel.findOne({ mail: normalizedEmail });
    if (breyusUser) {
      throw new ConflictException(
        'This email is registered with a Breyus account. Please use "I\'m a Breyus Member" to login.',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create blog user
    const blogUser = await this.blogUserModel.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyName: dto.companyName || '',
      website: dto.website || '',
      areaOfInterest: dto.areaOfInterest || '',
      experience: dto.experience || '',
      areaOfExpertise: dto.areaOfExpertise || '',
      isBrèyusMember: false,
      passwordSyncedFromBreyus: false,
      lastLoginAt: new Date(),
    });

    // Create session
    const token = await this.createSession(blogUser._id);

    this.logger.log(`Blog-only user created: ${normalizedEmail}`);

    return { user: blogUser, token };
  }

  /**
   * Blog-only user login
   * Standard email/password authentication
   */
  async login(
    dto: BlogLoginDto,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
  ): Promise<{ user: BlogUser; token: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const blogUser = await this.blogUserModel.findOne({
      email: normalizedEmail,
    });

    if (!blogUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      blogUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if Breyus member is suspended
    if (blogUser.isBrèyusMember && blogUser.breyusUserId) {
      const breyusUser = await this.userModel.findById(blogUser.breyusUserId);
      if (breyusUser?.isSuspended) {
        throw new UnauthorizedException(
          'Your Breyus account is suspended. Blog access is also restricted.',
        );
      }
    }

    // Update last login
    blogUser.lastLoginAt = new Date();
    await blogUser.save();

    // Create session
    const token = await this.createSession(blogUser._id, deviceInfo, ipAddress);

    return { user: blogUser, token };
  }

  /**
   * Breyus member OTP request
   * Step 1: Verify email exists in Breyus, send OTP
   */
  async requestBreyusMemberOtp(
    dto: BreyusMemberOtpRequestDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if email exists in Breyus users
    const breyusUser = await this.userModel.findOne({ mail: normalizedEmail });

    if (!breyusUser) {
      throw new NotFoundException(
        'Email not found in Breyus. Please sign up as a new reader or join Breyus first.',
      );
    }

    // Check if suspended
    if (breyusUser.isSuspended) {
      throw new UnauthorizedException('Your Breyus account is suspended.');
    }

    // Generate and send OTP
    const otp = this.mailService.generateOtp();
    await this.mailService.storeOtp(normalizedEmail, otp);
    await this.mailService.sendOtpEmail(normalizedEmail, otp);

    this.logger.log(`Breyus member OTP sent to: ${normalizedEmail}`);

    return { message: 'OTP sent to your email' };
  }

  /**
   * Breyus member OTP verification
   * Step 2: Verify OTP, create/update blog user, create session
   */
  async verifyBreyusMemberOtp(
    dto: BreyusMemberOtpVerifyDto,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
  ): Promise<{ user: BlogUser; token: string; isNewUser: boolean }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Validate OTP
    const isOtpValid = await this.mailService.validateOtp(
      normalizedEmail,
      dto.otp,
    );
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Get Breyus user
    const breyusUser = await this.userModel.findOne({ mail: normalizedEmail });
    if (!breyusUser) {
      throw new NotFoundException('Breyus user not found');
    }

    // Check if suspended
    if (breyusUser.isSuspended) {
      throw new UnauthorizedException('Your Breyus account is suspended.');
    }

    // Get company data for user info
    const company = await this.companyModel.findById(breyusUser.company);

    // Parse founder name into first/last
    const founderName = company?.founderName || 'Breyus Member';
    const nameParts = founderName.split(' ');
    const firstName = nameParts[0] || 'Breyus';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // Check if blog user already exists
    let blogUser = await this.blogUserModel.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!blogUser) {
      // Create new blog user with synced data from Breyus
      blogUser = await this.blogUserModel.create({
        email: normalizedEmail,
        password: breyusUser.password, // Sync password from Breyus
        firstName,
        lastName,
        companyName: company?.companyName || '',
        website: company?.websiteUrl || '',
        areaOfInterest: company?.mainLineBusiness?.join(', ') || '',
        experience: '',
        areaOfExpertise: '',
        breyusUserId: breyusUser._id,
        isBrèyusMember: true,
        passwordSyncedFromBreyus: true,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
      this.logger.log(`Breyus member blog user created: ${normalizedEmail}`);
    } else {
      // Update existing blog user
      if (!blogUser.isBrèyusMember) {
        // Upgrade blog-only user to Breyus member
        blogUser.breyusUserId = breyusUser._id;
        blogUser.isBrèyusMember = true;
        this.logger.log(
          `Blog user upgraded to Breyus member: ${normalizedEmail}`,
        );
      }
      blogUser.lastLoginAt = new Date();
      await blogUser.save();
    }

    // Create session
    const token = await this.createSession(blogUser._id, deviceInfo, ipAddress);

    return { user: blogUser, token, isNewUser };
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(blogUser: BlogUser): Promise<BlogUser> {
    // Check if Breyus member is still active
    if (blogUser.isBrèyusMember && blogUser.breyusUserId) {
      const breyusUser = await this.userModel.findById(blogUser.breyusUserId);
      if (breyusUser?.isSuspended) {
        throw new UnauthorizedException('Your Breyus account is suspended.');
      }
    }
    return blogUser;
  }

  /**
   * Logout - invalidate session
   */
  async logout(sessionId: Types.ObjectId): Promise<void> {
    await this.blogSessionModel.deleteOne({ _id: sessionId });
  }

  /**
   * Forgot password - send OTP
   */
  async forgotPassword(
    dto: BlogForgotPasswordDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const blogUser = await this.blogUserModel.findOne({
      email: normalizedEmail,
    });
    if (!blogUser) {
      // Don't reveal if email exists
      return {
        message: 'If this email exists, a password reset OTP will be sent',
      };
    }

    // For Breyus members, suggest using Breyus password reset
    if (blogUser.isBrèyusMember) {
      throw new BadRequestException(
        'As a Breyus member, please use the main Breyus platform to reset your password.',
      );
    }

    const otp = this.mailService.generateOtp();
    await this.mailService.storeOtp(`blog-reset:${normalizedEmail}`, otp);
    await this.mailService.sendPasswordResetEmail(normalizedEmail, otp);

    return {
      message: 'If this email exists, a password reset OTP will be sent',
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(dto: BlogResetPasswordDto): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const blogUser = await this.blogUserModel.findOne({
      email: normalizedEmail,
    });
    if (!blogUser) {
      throw new BadRequestException('Invalid request');
    }

    if (blogUser.isBrèyusMember) {
      throw new BadRequestException(
        'As a Breyus member, please use the main Breyus platform to reset your password.',
      );
    }

    // Validate OTP
    const isOtpValid = await this.mailService.validateOtp(
      `blog-reset:${normalizedEmail}`,
      dto.otp,
    );
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Update password
    blogUser.password = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    blogUser.passwordChangedAt = new Date();
    blogUser.passwordSyncedFromBreyus = false;
    await blogUser.save();

    // Invalidate all sessions
    await this.blogSessionModel.deleteMany({ blogUserId: blogUser._id });

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(
    blogUser: BlogUser,
    dto: BlogChangePasswordDto,
  ): Promise<{ message: string }> {
    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      blogUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    blogUser.password = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    blogUser.passwordChangedAt = new Date();
    blogUser.passwordSyncedFromBreyus = false;
    await blogUser.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Create a new session
   */
  private async createSession(
    blogUserId: Types.ObjectId,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
  ): Promise<string> {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRY_DAYS);

    // Create session
    await this.blogSessionModel.create({
      blogUserId,
      tokenHash,
      deviceInfo: deviceInfo || { browser: '', os: '', device: '' },
      ipAddress: ipAddress || '',
      expiresAt,
    });

    return token;
  }

  /**
   * Check if email is registered as Breyus user
   * Used by frontend to show appropriate login UI
   */
  async checkBreyusEmail(email: string): Promise<{ isBrèyusMember: boolean }> {
    const normalizedEmail = email.toLowerCase().trim();
    const breyusUser = await this.userModel.findOne({ mail: normalizedEmail });
    return { isBrèyusMember: !!breyusUser };
  }

  /**
   * Check for active Breyus session (main platform cookie)
   * Returns user profile if session exists, null otherwise
   */
  async checkBreyusSession(breyusUserId: string): Promise<{
    hasSession: boolean;
    profile?: {
      firstName: string;
      lastName: string;
      email: string;
      companyName: string;
      avatar?: string;
    };
  }> {
    try {
      // Get Breyus user
      const breyusUser = await this.userModel.findById(breyusUserId);
      if (!breyusUser) {
        return { hasSession: false };
      }

      // Check if suspended
      if (breyusUser.isSuspended) {
        return { hasSession: false };
      }

      // Get company data
      const company = await this.companyModel.findById(breyusUser.company);
      const founderName = company?.founderName || 'Breyus Member';
      const nameParts = founderName.split(' ');

      return {
        hasSession: true,
        profile: {
          firstName: nameParts[0] || 'Breyus',
          lastName: nameParts.slice(1).join(' ') || 'Member',
          email: breyusUser.mail,
          companyName: company?.companyName || '',
          avatar: undefined, // Company schema doesn't have logo field
        },
      };
    } catch (error) {
      this.logger.error('Error checking Breyus session:', error);
      return { hasSession: false };
    }
  }

  /**
   * SSO Login - Login using active Breyus session (no OTP required)
   * Creates or updates blog user and creates session
   */
  async ssoLogin(
    breyusUserId: string,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
  ): Promise<{ user: BlogUser; token: string; isNewUser: boolean }> {
    // Get Breyus user
    const breyusUser = await this.userModel.findById(breyusUserId);
    if (!breyusUser) {
      throw new NotFoundException('Breyus user not found');
    }

    // Check if suspended
    if (breyusUser.isSuspended) {
      throw new UnauthorizedException('Your Breyus account is suspended.');
    }

    const normalizedEmail = breyusUser.mail.toLowerCase().trim();

    // Get company data for user info
    const company = await this.companyModel.findById(breyusUser.company);

    // Parse founder name into first/last
    const founderName = company?.founderName || 'Breyus Member';
    const nameParts = founderName.split(' ');
    const firstName = nameParts[0] || 'Breyus';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // Check if blog user already exists
    let blogUser = await this.blogUserModel.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!blogUser) {
      // Create new blog user with synced data from Breyus
      blogUser = await this.blogUserModel.create({
        email: normalizedEmail,
        password: breyusUser.password, // Sync password from Breyus
        firstName,
        lastName,
        companyName: company?.companyName || '',
        website: company?.websiteUrl || '',
        areaOfInterest: company?.mainLineBusiness?.join(', ') || '',
        experience: '',
        areaOfExpertise: '',
        breyusUserId: breyusUser._id,
        isBrèyusMember: true,
        passwordSyncedFromBreyus: true,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
      this.logger.log(
        `Breyus member blog user created via SSO: ${normalizedEmail}`,
      );
    } else {
      // Update existing blog user
      if (!blogUser.isBrèyusMember) {
        // Upgrade blog-only user to Breyus member
        blogUser.breyusUserId = breyusUser._id;
        blogUser.isBrèyusMember = true;
        this.logger.log(
          `Blog user upgraded to Breyus member via SSO: ${normalizedEmail}`,
        );
      }
      blogUser.lastLoginAt = new Date();
      await blogUser.save();
    }

    // Create session
    const token = await this.createSession(blogUser._id, deviceInfo, ipAddress);

    this.logger.log(`Breyus member logged in via SSO: ${normalizedEmail}`);

    return { user: blogUser, token, isNewUser };
  }
}
