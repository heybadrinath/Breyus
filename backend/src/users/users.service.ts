import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/user.schema';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/users.dto';
import { Role } from 'src/users/user.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LoginUserDto } from './dto/login.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly authService: AuthService,
        private readonly mailService: MailService
    ) { }

    async minpasswordStrength(password: string): Promise<boolean> {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return (
            password.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumbers &&
            hasSpecialChars
        );
    }
    async HashPassword(password: string): Promise<string> {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async createUser(createUserdto: CreateUserDto): Promise<{ message: string; token: string }> {
        const { email, password, role, company } = createUserdto;

        // Validate password strength
        const isPasswordStrong = await this.minpasswordStrength(password);
        if (!isPasswordStrong) {
            throw new HttpException(
                'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (![Role.Buyer, Role.Seller].includes(role)) {
            throw new HttpException(
                'Invalid role. Valid roles are: buyer, seller',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            // Check if user already exists
            const existingUser = await this.userModel.findOne({ email });
            if (existingUser) {
                throw new HttpException('User already exists with this email', HttpStatus.CONFLICT);
            }

            const hashedPassword = await this.HashPassword(password);
            const newUser = new this.userModel({
                email,
                password: hashedPassword,
                role,
                company: company ? company : null,
            });
            const savedUser = await newUser.save();
            const token: any = await this.authService.generateJwtToken(savedUser);
            return {
                message: 'User created successfully',
                token,
            };

        } catch (error) {
            if (error.code === 11000) {
                throw new HttpException('User already exists with this email', HttpStatus.CONFLICT);
            } else {
                throw new HttpException('Error creating user: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    // Check if a user exists by email
    async userExists(email: string): Promise<boolean> {
        const user = await this.userModel.findOne({ email }).exec(); // Find a user by email
        return !!user; // Returns true if user is found, otherwise false
    }

    async loginUser(loginUserDto: LoginUserDto): Promise<{ message: string; token: string }> {
        const { email, password, otp } = loginUserDto;

        // Check if user exists
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new HttpException(
                `Account locked. Try again after ${Math.ceil((user.lockUntil - Date.now()) / 60000)} minutes.`,
                HttpStatus.FORBIDDEN,
            );
        }

        // Check password
        const bcrypt = require('bcrypt');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            let lockUntil = user.lockUntil;

            if (failedAttempts >= 3) {
                lockUntil = Date.now() + 5 * 60 * 1000; // lock for 5 minutes
            }

            await this.userModel.updateOne(
                { _id: user._id },
                {
                    $set: {
                        failedLoginAttempts: failedAttempts,
                        ...(lockUntil ? { lockUntil } : {}),
                    },
                }
            );

            if (failedAttempts >= 3) {
                throw new HttpException(
                    'Account locked due to too many failed login attempts. Try again after 5 minutes.',
                    HttpStatus.FORBIDDEN,
                );
            } else {
                throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
            }
        } else {
            // Reset failed login attempts and lockUntil on successful login
            if (user.failedLoginAttempts || user.lockUntil) {
                await this.userModel.updateOne(
                    { _id: user._id },
                    { $set: { failedLoginAttempts: 0, lockUntil: null } }
                );
            }
        }

        // Validate OTP
        const isOtpValid = this.mailService.validateOtp(email, otp);
        if (!isOtpValid) {
            throw new HttpException('Invalid OTP or OTP expired.', HttpStatus.UNAUTHORIZED);
        }
        // Generate JWT token
        const token: any = await this.authService.generateJwtToken(user);
        return {
            message: 'Login successful',
            token,
        };
    }


    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { email, password, role, company } = updateUserDto;

        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = await this.HashPassword(password);
        if (role) updateData.role = role;
        if (company) updateData.company = company;

        const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUser) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }
        return updatedUser;
    }





}
