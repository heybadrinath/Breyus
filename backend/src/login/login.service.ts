import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from '../users/user.schema'
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
    ) { }

    async Login(loginDto: loginDto) {
        const { mail, password } = loginDto;


        const user = await this.userSchema.findOne({ mail });
        if (!user) {
            throw new HttpException('User not found, signup before login', HttpStatus.BAD_REQUEST);
        }


        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
        }

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

    }

    async ValidateOtp(otpDto:otpDto) {
        const {mail, otp} = otpDto

        const user = await this.userSchema.findOne({ mail }).populate<{ company: Company }>('company', 'role');
        if(!user){
            throw new HttpException('User not found, signup before login', HttpStatus.BAD_REQUEST);
        }

        const isotpValid = await this.mailService.validateOtp(mail as string,otp as string);
        if(!isotpValid){
            throw new HttpException(
                'Invalid Otp',
                HttpStatus.BAD_REQUEST
            )
        }

        const AccountToken = this.authService.generateAccountToken(user._id as string, user.company._id as string);

        return { AccountToken, role: user.company.role };

    }

}
