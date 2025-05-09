import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt/jwt.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, string>(); // Temporary OTP storage
  private resetOtpStore = new Map<string, string>(); // Separate store for password reset OTPs
  private registrationOtpStore = new Map<string, { otp: string, userData: any }>(); // Store for registration OTPs
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async generateOtpAndSend(email: string, password: string, requestedRole?: string) {
    // Validate user credentials before sending OTP
    const user = await this.usersService.validateCredentials(email, password);
    
    if (!user) {
      this.logger.warn(`Failed login attempt for ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if the requested role matches the user's role
    if (requestedRole && user.role !== requestedRole) {
      this.logger.warn(`Role mismatch for ${email}. User is a ${user.role}, but tried to log in as ${requestedRole}`);
      throw new UnauthorizedException(`Access denied. This login is for ${requestedRole}s only.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    this.otpStore.set(email, otp);

    // Set OTP expiration (10 minutes)
    setTimeout(() => {
      if (this.otpStore.get(email) === otp) {
        this.otpStore.delete(email);
      }
    }, 10 * 60 * 1000);

    await this.mailService.sendOtp(email, otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = this.otpStore.get(email);

    if (!storedOtp || storedOtp !== otp) {
      this.logger.warn(`Invalid OTP attempt for ${email}`);
      return { message: 'Invalid OTP', success: false };
    }

    this.otpStore.delete(email); // Remove OTP after verification
    
    // Fetch user data
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      return { message: 'User not found', success: false };
    }
    
    // Generate JWT token
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Get user data without sensitive information
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    
    this.logger.log(`OTP verified successfully for ${email}. User authenticated.`);
    return { 
      message: 'OTP verified successfully', 
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

    // Check if role matches if provided
    if (role && user.role !== role) {
      this.logger.warn(`Password reset attempt with incorrect role for ${email}. Requested: ${role}, Actual: ${user.role}`);
      throw new UnauthorizedException('Invalid account role. Please use the correct portal.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    this.resetOtpStore.set(email, otp);

    // Set OTP expiration (10 minutes)
    setTimeout(() => {
      if (this.resetOtpStore.get(email) === otp) {
        this.resetOtpStore.delete(email);
      }
    }, 10 * 60 * 1000);

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

    // Check if role matches if provided
    if (role && user.role !== role) {
      this.logger.warn(`Password reset attempt with incorrect role for ${email}. Requested: ${role}, Actual: ${user.role}`);
      throw new UnauthorizedException('Invalid account role. Please use the correct portal.');
    }

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
    }, 10 * 60 * 1000);

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
