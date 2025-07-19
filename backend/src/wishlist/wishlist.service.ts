import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Wishlist } from './wishlist.schema';
import { Types } from 'mongoose';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistSchema: ReturnModelType<typeof Wishlist>,
  ) {}

  async addToWishlist(userId: string, productId: string) {
    const exists = await this.wishlistSchema.findOne({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
    });

    if (exists) {
      throw new Error('Product already in wishlist');
    }

    const wishlistItem = await this.wishlistSchema.create({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
      dateAdded: new Date(),
    });

    return wishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string) {
    const result = await this.wishlistSchema.deleteOne({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Wishlist item not found');
    }

    return { message: 'Removed from wishlist' };
  }

  async getUserWishlist(userId: string) {
    const wishlistItems = await this.wishlistSchema
      .find({ user: new Types.ObjectId(userId) })
      .populate('product')
      .exec();

    return wishlistItems.map(item => item.product);
  }
}
