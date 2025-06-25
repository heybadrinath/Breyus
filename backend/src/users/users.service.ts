import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/user.schema';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/users.dto';
import { Role } from 'src/users/user.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly authService: AuthService,
    ) { }

    async HashPassword(password: string): Promise<string> {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async createUser(createUserdto: CreateUserDto): Promise<{ message: string; token: string }> {
        const { email, password, role, company } = createUserdto;

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

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { email, password, role, company } = updateUserDto;

        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = await this.HashPassword(password);
        if (role) updateData.role = role;
        if (company) updateData.company = company;

        const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    async deleteUser(id: string): Promise<User> {
        const deletedUser = await this.userModel.findByIdAndDelete(id);
        if (!deletedUser) {
            throw new Error('User not found');
        }
        return deletedUser;
    }

    async findUserById(id: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return await this.userModel.findOne({ email }).exec();
    }

}
