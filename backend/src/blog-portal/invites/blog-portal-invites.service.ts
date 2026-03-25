import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogWriterInvite } from '../schemas/blog-writer-invite.schema';
import { BlogUser } from '../schemas/blog-user.schema';

/**
 * BlogPortalInvitesService handles writer invite validation and claiming
 */
@Injectable()
export class BlogPortalInvitesService {
  constructor(
    @InjectModel(BlogWriterInvite.name)
    private readonly inviteModel: Model<BlogWriterInvite>,
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
  ) {}

  /**
   * Validate an invite token
   */
  async validateInvite(token: string) {
    const invite = await this.inviteModel.findOne({ token });

    if (!invite) {
      return {
        valid: false,
        message: 'Invalid invite token',
      };
    }

    // Check if already used
    if (invite.usedBy) {
      return {
        valid: false,
        used: true,
        message: 'This invite has already been used',
      };
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return {
        valid: false,
        expired: true,
        message: 'This invite has expired',
      };
    }

    return {
      valid: true,
      emailHint: invite.emailHint,
      expiresAt: invite.expiresAt.toISOString(),
      message: 'Valid invite',
    };
  }

  /**
   * Claim an invite (make user a writer)
   */
  async claimInvite(token: string, blogUserId: string) {
    const invite = await this.inviteModel.findOne({ token });

    if (!invite) {
      throw new HttpException('Invalid invite token', HttpStatus.NOT_FOUND);
    }

    // Check if already used
    if (invite.usedBy) {
      throw new HttpException(
        'This invite has already been used',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      throw new HttpException(
        'This invite has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get user
    const user = await this.blogUserModel.findById(blogUserId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if already a writer
    if (user.isWriter) {
      return {
        success: true,
        message: 'You are already a writer',
      };
    }

    // Update user to be a writer
    await this.blogUserModel.updateOne(
      { _id: new Types.ObjectId(blogUserId) },
      {
        isWriter: true,
        writerApprovedAt: new Date(),
      },
    );

    // Mark invite as used
    await this.inviteModel.updateOne(
      { _id: invite._id },
      {
        usedBy: new Types.ObjectId(blogUserId),
        usedAt: new Date(),
      },
    );

    return {
      success: true,
      message: 'You are now a writer! You can create blog posts.',
    };
  }
}
