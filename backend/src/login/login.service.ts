import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from '../users/user.schema';
import { Company, CompanySchema } from 'src/company/company.schema';
import { AuthService } from 'src/auth/auth.service';
import { loginDto, otpDto } from './login.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class LoginService {
  constructor(
    @InjectModel(Company.name) private readonly companySchema: Model<Company>,
    @InjectModel(User.name) private readonly userSchema: Model<User>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async Login(loginDto: loginDto) {
    const { mail, password } = loginDto;

    const user = await this.userSchema
      .findOne({ mail })
      .populate<{ company: Company }>('company', 'role');
    if (!user) {
      throw new HttpException(
        'No account found with this email. Please sign up first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Incorrect password. Please try again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if user is suspended
    if (user.isSuspended) {
      throw new HttpException(
        'Your account has been suspended. Please contact support for assistance.',
        HttpStatus.FORBIDDEN,
      );
    }

    // TESTING BYPASS: Skip OTP and return token directly
    // TODO: Remove this bypass and uncomment OTP logic below for production
    const AccountToken = this.authService.generateAccountToken(
      user._id.toString(),
      (user.company as any)._id.toString(),
    );
    return { AccountToken, role: user.company.role, bypassOtp: true };

    /* ORIGINAL OTP LOGIC - Uncomment for production
        try {
            const otp = this.mailService.generateOtp()
            await this.mailService.storeOtp(mail as string, otp as string);
            await this.mailService.sendOtpEmail(mail as string, otp as string);
        } catch (e) {
            throw new HttpException(
                'Failed to send otp!',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        */
  }

  async ValidateOtp(otpDto: otpDto) {
    const { mail, otp } = otpDto;

    const user = await this.userSchema
      .findOne({ mail })
      .populate<{ company: Company }>('company', 'role');
    if (!user) {
      throw new HttpException(
        'No account found with this email. Please sign up first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isotpValid = await this.mailService.validateOtp(mail, otp);
    if (!isotpValid) {
      throw new HttpException(
        'Invalid or expired OTP. Please check your code and try again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Double-check suspension status before issuing token
    // (User could have been suspended between login and OTP validation)
    if (user.isSuspended) {
      throw new HttpException(
        'Your account has been suspended. Please contact support for assistance.',
        HttpStatus.FORBIDDEN,
      );
    }

    const AccountToken = this.authService.generateAccountToken(
      user._id.toString(),
      (user.company as any)._id.toString(),
    );

    return { AccountToken, role: user.company.role };
  }
}
