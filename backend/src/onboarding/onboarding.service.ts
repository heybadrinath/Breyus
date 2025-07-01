import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { SendEmailOtpDto, VerifyEmailOtpDto, SetPasswordDto, continueOnboardingDto } from 'src/onboarding/dto/onboarding.dto';
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



@Injectable()
export class OnboardingService {
    constructor(
        @InjectModel(Company.name) private readonly companySchema: Model<Company>,
        @InjectModel(User.name) private readonly userSchema: Model<User>,
        private readonly mailService: MailService,
        private readonly authService: AuthService
    ) { }



    // step1 creating and onboarding the user

    async sendMailOtp(sendMailOtp: SendEmailOtpDto): Promise<String> {
        const { email } = sendMailOtp;
        try {
            const otp = this.mailService.generateOtp()
            await this.mailService.storeOtp(email as string, otp as string);
            await this.mailService.sendOtpEmail(email as string, otp as string);
            return 'Otp has been sent to your email';
        } catch (e) {
            throw new HttpException(
                'Failed to send otp!',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async ValidateMailOtp(verifyEmailOtpDto: VerifyEmailOtpDto): Promise<any> {
        const { email, otp } = verifyEmailOtpDto;


        if (!this.mailService.validateOtp(email as string, otp as string)) {
            throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
        }


        const user = await this.userSchema.findOne({ mail: email }).populate('company', 'isOnboardingCompleted').exec();

        if (!user) {
            const onboardingToken = this.authService.generateOnboardingToken({ mail: email as string });
            return { token: onboardingToken, onboardingStatus: 'false' };
        }

        if (user.company && typeof user.company === 'object' && 'isOnboardingCompleted' in user.company) {
            const companyOnboardingStatus = (user.company as any).isOnboardingCompleted;
            const onboardingToken = this.authService.generateOnboardingToken({ userId: user._id as string });
            return { token: onboardingToken, onboardingStatus: companyOnboardingStatus };
        }





    }

    async SetPassword(setPasswordDto: SetPasswordDto, onboardingToken): Promise<string> {
        const { setPassword, confirmPassword } = setPasswordDto;

        // verify if password match 
        if (setPassword !== confirmPassword) {
            throw new HttpException(
                'Set passwords and confirm passwords don\'t match',
                HttpStatus.BAD_REQUEST
            );
        }

        // decode the jwt token
        let decodeToken;
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        try {
            decodeToken = jwt.verify(onboardingToken, jwtSecret);
        } catch (e) {
            throw new HttpException('Invalid or expired onboarding token', HttpStatus.BAD_REQUEST);
        }

        // extract user object id from decoded token
        const mail = decodeToken.mail;
        if (!mail) {
            throw new HttpException('Please Verify your email through otp first!', HttpStatus.NOT_FOUND);
        }

        // Check if user already exists
        const existingUser = await this.userSchema.findOne({ mail: mail });
        if (existingUser) {
            throw new HttpException("Account already exists!", HttpStatus.BAD_REQUEST);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(setPassword, 10);

        // create company empty database
        let savedCompany;
        try {
            const company = new this.companySchema();
            savedCompany = await company.save();
        } catch (e) {
            throw new HttpException(
                'Unable to create Companies Database please try again later',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        // create an user database
        let savedUser;
        try {
            const User = new this.userSchema({
                mail: mail,
                password: hashedPassword,
                company: savedCompany._id
            });
            savedUser = await User.save();
        } catch (e) {
            throw new HttpException(
                'Unable to create User Database please try again later',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }


        const JwtToken = this.authService.generateAccountToken(savedUser._id);
        response.cookie('access_token', JwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400000,
            signed: true,
        });
        return JwtToken;
    }




    async continueOnboarding(continueOnboardingDto, onboardingToken: string) {
        const { password } = continueOnboardingDto;

        try {
            const jwtSecret = process.env.JWT_SECRET_KEY;
            if (!jwtSecret) {
                throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
            }
            const decodeToken = jwt.verify(onboardingToken, jwtSecret);
            if (typeof decodeToken !== 'object' || decodeToken === null || !('userId' in decodeToken)) {
                throw new HttpException('Invalid token payload', HttpStatus.BAD_REQUEST);
            }
            const userId = (decodeToken as jwt.JwtPayload).userId;

            const user = await this.userSchema.findById(userId);

            if (!user) {
                throw new HttpException("User not found", HttpStatus.NOT_FOUND);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new HttpException("Invalid Password", HttpStatus.BAD_REQUEST);
            }

            const JwtToken = this.authService.generateAccountToken(userId as string);
            return JwtToken;

        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST);
        }
    }


}


// step 2 logic
