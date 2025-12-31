import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { SendEmailOtpDto, VerifyEmailOtpDto, SetPasswordDto, continueOnboardingDto, Step2Dto, Step3Dto, Step4Dto, Step5Dto } from 'src/onboarding/dto/onboarding.dto';
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


        if (!(await this.mailService.validateOtp(email as string, otp as string))) {
            throw new HttpException('Invalid or expired OTP. Please check your code and try again.', HttpStatus.BAD_REQUEST);
        }


        const user = await this.userSchema.findOne({ mail: email }).populate('company', 'isOnboardingCompleted').exec();

        if (!user) {
            const onboardingToken = this.authService.generateOnboardingToken({ mail: email as string });
            return { token: onboardingToken, onboardingStatus: 'false' };
        }

        if (user.company && typeof user.company === 'object' && 'isOnboardingCompleted' in user.company) {
            const companyOnboardingStatus = (user.company as any).isOnboardingCompleted;
            const onboardingToken = this.authService.generateOnboardingToken({ userId: user._id.toString() });
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

        const JwtToken = this.authService.generateAccountToken(savedUser._id, savedCompany._id);
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

            const user = await this.userSchema.findById(userId).populate('company');

            if (!user) {
                throw new HttpException("User not found", HttpStatus.NOT_FOUND);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new HttpException("Incorrect password. Please try again.", HttpStatus.BAD_REQUEST);
            }

            const JwtToken = this.authService.generateAccountToken(userId as string, user.company._id as unknown as string);
            return JwtToken;

        } catch (e) {
            // Re-throw HttpException as-is, otherwise wrap the error
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException(e.message || 'Failed to continue onboarding.', HttpStatus.BAD_REQUEST);
        }
    }

    // step 2 logic
    async step2(step2Dto: Step2Dto, AccountToken: string) {
        const { companyName, companyAddress, companyMobile, taxId } = step2Dto;

        const jwtSecret = process.env.JWT_SECRET_KEY;
        let payload;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        try {
            payload = jwt.verify(AccountToken, jwtSecret);
        } catch (e) {
            throw new HttpException('Unauthorised, please verify again!', HttpStatus.BAD_REQUEST);
        }
        const userId = payload.userId;

        const user = await this.userSchema.findById(userId).populate('company', '_id');

        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        if (!user.company || !user.company._id) {
            throw new HttpException("Company not found for user", HttpStatus.NOT_FOUND);
        }

        try {
            const companyId = user.company._id;
            const updateCompany = await this.companySchema.findByIdAndUpdate(
                companyId,
                {
                    companyName,
                    companyAddress,
                    companyMobile,
                    taxId
                },
                { new: true }
            );

            if (!updateCompany) {
                throw new HttpException('Company not found or update failed', HttpStatus.NOT_FOUND);
            }

            return updateCompany;
        } catch (error) {

            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error while updating company', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    // step3 logic
    async step3(step3Dto: Step3Dto, AccountToken: string) {
        const { mainLineBusiness, meanMonthlyRevenue } = step3Dto;

        const jwtSecret = process.env.JWT_SECRET_KEY;
        let payload;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        try {
            payload = jwt.verify(AccountToken, jwtSecret);
        } catch (e) {
            throw new HttpException('Unauthorised, please verify again!', HttpStatus.BAD_REQUEST);
        }
        const userId = payload.userId;

        const user = await this.userSchema.findById(userId).populate('company', '_id');

        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        if (!user.company || !user.company._id) {
            throw new HttpException("Company not found for user", HttpStatus.NOT_FOUND);
        }

        try {
            const companyId = user.company._id;
            const updateCompany = await this.companySchema.findByIdAndUpdate(
                companyId,
                {
                    mainLineBusiness,
                    meanMonthlyRevenue
                },
                { new: true }
            );

            if (!updateCompany) {
                throw new HttpException('Company not found or update failed', HttpStatus.NOT_FOUND);
            }

            return updateCompany;
        } catch (error) {

            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error while updating company', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // step 4
    async step4(step4Dto: Step4Dto, AccountToken: string) {
        const { websiteUrl, founderName, exportedBefore, referrel } = step4Dto;

        const jwtSecret = process.env.JWT_SECRET_KEY;
        let payload;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        try {
            payload = jwt.verify(AccountToken, jwtSecret);
        } catch (e) {
            throw new HttpException('Unauthorised, please verify again!', HttpStatus.BAD_REQUEST);
        }
        const userId = payload.userId;

        const user = await this.userSchema.findById(userId).populate('company', '_id');

        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        if (!user.company || !user.company._id) {
            throw new HttpException("Company not found for user", HttpStatus.NOT_FOUND);
        }

        try {
            const companyId = user.company._id;
            const updateCompany = await this.companySchema.findByIdAndUpdate(
                companyId,
                {
                    websiteUrl,
                    founderName,
                    exportedBefore,
                    referrel
                },
                { new: true }
            );

            if (!updateCompany) {
                throw new HttpException('Company not found or update failed', HttpStatus.NOT_FOUND);
            }

            return updateCompany;
        } catch (error) {

            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error while updating company', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // step 5
    async step5(step5Dto: Step5Dto, AccountToken: string) {
        const { role } = step5Dto;

        const jwtSecret = process.env.JWT_SECRET_KEY;
        let payload;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        try {
            payload = jwt.verify(AccountToken, jwtSecret);
        } catch (e) {
            throw new HttpException('Unauthorised, please verify again!', HttpStatus.BAD_REQUEST);
        }
        const userId = payload.userId;

        const user = await this.userSchema.findById(userId).populate('company', '_id');

        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        if (!user.company || !user.company._id) {
            throw new HttpException("Company not found for user", HttpStatus.NOT_FOUND);
        }

        try {
            const companyId = user.company._id;
            const updateCompany = await this.companySchema.findByIdAndUpdate(
                companyId,
                {
                    role,
                    isOnboardingCompleted: true
                },
                { new: true }
            );

            if (!updateCompany) {
                throw new HttpException('Company not found or update failed', HttpStatus.NOT_FOUND);
            }

            return updateCompany;
        } catch (error) {

            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Internal server error while updating company', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    

    async fetchOnboardingDetails(token: string): Promise<any>

    {
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            throw new InternalServerErrorException('JWT secret key is not defined in environment variables');
        }
        let payload;
        try {
            payload = jwt.verify(token, jwtSecret);
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const userId = payload.userId;

        const user = await this.userSchema.findById(userId).populate('company').exec();

        if (!user || !user.company) {
            throw new NotFoundError('User or company not found');
        }

        return user.company;
    }
}



