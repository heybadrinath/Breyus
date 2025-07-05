import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userSchema: Model<User>,
    ) {}

    async returnName(userId): Promise<string> {
        try {
            const user = await this.userSchema.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user.mail;
        } catch (error) {
            throw new Error('Error fetching user');
        }
    }
}
