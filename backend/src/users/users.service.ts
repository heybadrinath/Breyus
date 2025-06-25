import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/user.schema';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/users.dto';
import { Role } from 'src/users/user.schema';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async HashPassword(password: string): Promise<string> {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async createUser(createUserdto: CreateUserDto): Promise<User> {
        const { email, password, role, company } = createUserdto;

        if (![Role.user, Role.admin].includes(role)) {
      throw new HttpException(
        'Invalid role. Valid roles are: user, admin',
        HttpStatus.BAD_REQUEST,
      );
    }

        try {
            const hashedPassword = await this.HashPassword(password);
            const newUser = new this.userModel({
                email,
                password: hashedPassword,
                role,
                company: company ? company : null,
            });
            return await newUser.save();
        } catch(error){
            if (error.code === 11000) {
                const { ConflictException } = require('@nestjs/common');
                throw new ConflictException('User already exists with this email');
            } else {
                throw new Error('Error creating user: ' + error.message);
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
