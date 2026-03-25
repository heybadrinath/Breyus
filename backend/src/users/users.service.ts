import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  NotificationPreferences,
  defaultNotificationPreferences,
  AINotificationPreferences,
  defaultAINotificationPreferences,
} from './user.schema';
import * as bcrypt from 'bcrypt';

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

  async findById(userId: string): Promise<User | null> {
    try {
      return await this.userSchema.findById(userId).exec();
    } catch (error) {
      throw new Error('Error fetching user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userSchema.findOne({ mail: email }).exec();
    } catch (error) {
      throw new Error('Error fetching user by email');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      await this.userSchema.findByIdAndUpdate(userId, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
    } catch (error) {
      throw new Error('Error updating password');
    }
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    try {
      await this.userSchema.findByIdAndUpdate(userId, {
        passwordResetToken: token,
        passwordResetExpires: expires,
      });
    } catch (error) {
      throw new Error('Error setting password reset token');
    }
  }

  async verifyPassword(
    userId: string,
    currentPassword: string,
  ): Promise<boolean> {
    try {
      const user = await this.userSchema
        .findById(userId)
        .select('+password')
        .exec();
      if (!user || !user.password) {
        return false;
      }
      return await bcrypt.compare(currentPassword, user.password);
    } catch (error) {
      throw new Error('Error verifying password');
    }
  }

  async getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    try {
      const user = await this.userSchema.findById(userId).exec();
      if (!user) {
        throw new Error('User not found');
      }
      const prefs =
        user.notificationPreferences || defaultNotificationPreferences;
      return {
        email: {
          ...defaultNotificationPreferences.email,
          ...prefs.email,
        },
        realtime: {
          ...defaultNotificationPreferences.realtime,
          ...prefs.realtime,
        },
      };
    } catch (error) {
      throw new Error('Error fetching notification preferences');
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    try {
      const mergedPreferences = {
        email: {
          ...defaultNotificationPreferences.email,
          ...preferences.email,
        },
        realtime: {
          ...defaultNotificationPreferences.realtime,
          ...preferences.realtime,
        },
      };

      const user = await this.userSchema
        .findByIdAndUpdate(
          userId,
          { notificationPreferences: mergedPreferences },
          { new: true },
        )
        .exec();

      if (!user) {
        throw new Error('User not found');
      }

      return user.notificationPreferences;
    } catch (error) {
      throw new Error('Error updating notification preferences');
    }
  }

  // AI Buddy notification preferences methods (Settings Page)

  async getAINotificationPreferences(
    userId: string,
  ): Promise<AINotificationPreferences> {
    try {
      const user = await this.userSchema.findById(userId).exec();
      if (!user) {
        throw new Error('User not found');
      }
      return user.aiNotificationPreferences || defaultAINotificationPreferences;
    } catch (error) {
      throw new Error('Error fetching AI notification preferences');
    }
  }

  async updateAINotificationPreferences(
    userId: string,
    preferences: AINotificationPreferences,
  ): Promise<AINotificationPreferences> {
    try {
      const mergedPreferences: AINotificationPreferences = {
        useExistingEmail: preferences.useExistingEmail ?? true,
        email: preferences.useExistingEmail ? undefined : preferences.email,
      };

      const user = await this.userSchema
        .findByIdAndUpdate(
          userId,
          { aiNotificationPreferences: mergedPreferences },
          { new: true },
        )
        .exec();

      if (!user) {
        throw new Error('User not found');
      }

      return user.aiNotificationPreferences;
    } catch (error) {
      throw new Error('Error updating AI notification preferences');
    }
  }
}
