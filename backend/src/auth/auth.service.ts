import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt/jwt.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; requestedRole?: string }>(); // Store OTP with requested role
  private resetOtpStore = new Map<string, string>(); // Separate store for password reset OTPs
  private registrationOtpStore = new Map<string, { otp: string, userData: any }>(); // Store for registration OTPs
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpirationTime: number;
  private readonly bcryptRounds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    // Get configuration values from environment variables
    this.otpExpirationTime = this.configService.get<number>('OTP_EXPIRATION_MINUTES', 10) * 60 * 1000; // Convert to milliseconds
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    
    this.logger.log(`Auth service initialized with OTP expiration: ${this.otpExpirationTime / 60000} minutes`);
  }

  async generateOtpAndSend(email: string, password: string, requestedRole?: string) {
    // Validate user credentials before sending OTP
    const user = await this.usersService.validateCredentials(email, password);
    
    if (!user) {
      this.logger.warn(`Failed login attempt for ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Remove role validation - allow users to access any portal with their credentials
    // This enables unified account access across buyer and seller portals

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    this.otpStore.set(email, { otp, requestedRole });

    // Set OTP expiration (10 minutes)
    setTimeout(() => {
      const stored = this.otpStore.get(email);
      if (stored && stored.otp === otp) {
        this.otpStore.delete(email);
      }
    }, this.otpExpirationTime);

    await this.mailService.sendOtp(email, otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const storedData = this.otpStore.get(email);

    if (!storedData || storedData.otp !== otp) {
      this.logger.warn(`Invalid OTP attempt for ${email}`);
      return { message: 'Invalid or expired OTP', success: false };
    }

    // Find user for login
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'User not found', success: false };
    }

    // Update user's role to match the portal they're accessing
    const roleToSet = storedData.requestedRole || user.role;
    if (roleToSet !== user.role) {
      await this.usersService.update(user.id, { role: roleToSet });
      this.logger.log(`Updated user ${email} role from ${user.role} to ${roleToSet}`);
    }

    // Check if user details exist, create if not
    try {
      await this.usersService.findUserDetailsById(user.id);
    } catch (error) {
      // If no user details exist, create them with empty values
      if (error instanceof NotFoundException) {
        await this.usersService.updateUserDetails(user.id, {
          contactNumber: '',
          alternateNumber1: '',
          alternateNumber2: '',
          alternateEmail: '',
          address: '',
          city: '',
          state: '',
          country: '',
          companyName: '',
          companyWebsite: '',
          gstin: '',
          companyAddress: '',
          socials: '',
          accountType: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
        });
      }
    }

    // Generate JWT token with the updated role
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: roleToSet
    });

    // Remove the used OTP
    this.otpStore.delete(email);

    // Prepare user data without sensitive information, using the updated role
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: roleToSet,
    };
    
    return { 
      message: 'Login successful', 
      success: true,
      token,
      user: userData
    };
  }

  async forgotPassword(email: string, role?: string) {
    // Check if email exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Password reset attempt for non-existent email: ${email}`);
      throw new NotFoundException('Email not found');
    }

    // Remove role validation - allow password reset from any portal
    // This enables unified account access across buyer and seller portals

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    this.resetOtpStore.set(email, otp);

    // Set OTP expiration (10 minutes)
    setTimeout(() => {
      if (this.resetOtpStore.get(email) === otp) {
        this.resetOtpStore.delete(email);
      }
    }, this.otpExpirationTime);

    await this.mailService.sendPasswordResetOtp(email, otp);
    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string, role?: string) {
    const storedOtp = this.resetOtpStore.get(email);

    if (!storedOtp || storedOtp !== otp) {
      this.logger.warn(`Invalid password reset OTP attempt for ${email}`);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find user and update password
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove role validation - allow password reset from any portal
    // This enables unified account access across buyer and seller portals

    // Update the password
    await this.usersService.updatePassword(user.id, newPassword);
    
    // Delete the used OTP
    this.resetOtpStore.delete(email);
    
    this.logger.log(`Password reset successful for ${email}`);
    return { message: 'Password reset successful', success: true };
  }

  async register(
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string, 
    role: string = 'buyer'
  ) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new UnauthorizedException('Email already registered');
    }

    // First send an OTP for email verification
    await this.sendRegistrationOtp(email, { email, password, firstName, lastName, role });
    
    return { message: 'Verification OTP sent to your email', success: true };
  }

  async sendRegistrationOtp(email: string, userData: any) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    
    // Store OTP and user data for later verification
    this.registrationOtpStore.set(email, { otp, userData });

    // Set OTP expiration (10 minutes)
    setTimeout(() => {
      if (this.registrationOtpStore.has(email)) {
        this.registrationOtpStore.delete(email);
      }
    }, this.otpExpirationTime);

    await this.mailService.sendOtp(email, otp);
    return { message: 'Registration OTP sent successfully' };
  }

  async verifyRegistrationOtp(email: string, otp: string) {
    const registrationData = this.registrationOtpStore.get(email);

    if (!registrationData || registrationData.otp !== otp) {
      this.logger.warn(`Invalid registration OTP attempt for ${email}`);
      return { message: 'Invalid or expired OTP', success: false };
    }

    try {
      // Create the user after OTP verification
      const newUser = await this.usersService.create({
        email: registrationData.userData.email,
        password: registrationData.userData.password,
        firstName: registrationData.userData.firstName,
        lastName: registrationData.userData.lastName,
        role: registrationData.userData.role,
        isEmailVerified: true,
      });

      // Initialize user details record with empty values
      await this.usersService.updateUserDetails(newUser.id, {
        // Default empty fields
        contactNumber: '',
        alternateNumber1: '',
        alternateNumber2: '',
        alternateEmail: '',
        address: '',
        city: '',
        state: '',
        country: '',
        companyName: '',
        companyWebsite: '',
        gstin: '',
        companyAddress: '',
        socials: '',
        accountType: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
      });

      // Remove the used OTP and data
      this.registrationOtpStore.delete(email);
      
      // Generate JWT token for new user
      const token = this.jwtService.generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      // Prepare user data without sensitive information
      const userData = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      };
      
      this.logger.log(`Registration successful for ${email}`);
      return { 
        message: 'Registration successful', 
        success: true,
        token,
        user: userData
      };
    } catch (error) {
      this.logger.error(`Error during user creation: ${error.message}`, error.stack);
      
      // Check if this is a duplicate email error
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        return { 
          message: 'This email is already registered', 
          success: false,
          error: 'duplicate_email'
        };
      }
      
      // For any other database errors
      if (error.code || error.errno) {
        this.logger.error(`Database error: ${JSON.stringify(error)}`);
        return { 
          message: 'Database error during registration', 
          success: false,
          error: 'database_error'
        };
      }
      
      return { 
        message: 'Error during registration. Please try again later.', 
        success: false,
        error: 'registration_failed'
      };
    }
  }

  async validateUser(email: string, password: string) {
    return this.usersService.validateCredentials(email, password);
  }

  async validateToken(token: string) {
    try {
      // Verify the token
      const decoded = this.jwtService.verifyToken(token);
      if (!decoded) {
        return { valid: false, message: 'Invalid token' };
      }
      
      // Verify the user still exists
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        return { valid: false, message: 'User not found' };
      }
      
      // Return token validity with user data but without sensitive information
      return { 
        valid: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      this.logger.error(`Error validating token: ${error.message}`);
      return { valid: false, message: 'Error validating token' };
    }
  }
}
