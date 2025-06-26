import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/users.dto';
import { LoginUserDto } from './dto/login.dto';
import { HttpException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly mailService: MailService
    ) { };
  

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.createUser(createUserDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async loginUser(@Body() loginUserDto: LoginUserDto) {
        return await this.usersService.loginUser(loginUserDto);
    }

    @Post('send-otp')
    async sendOtp(@Body('email') email: string): Promise<{ message: string }> {
        // Check if the email is valid or the user exists
        const userExists = await this.usersService.userExists(email);
        if (!userExists) {
            throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
        }

        // Generate OTP
        const otp = this.mailService.generateOtp();

        // Store OTP temporarily in a cache
        await this.mailService.storeOtp(email, otp);

        // Send OTP email
        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'OTP sent to your email' };
    }
}



