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
      .populate({
        path: 'product',
        model: 'Product',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'mail company',
          populate: {
            path: 'company',
            model: 'Company',
            select: 'companyName'
          }
        }
      })
      .lean()
      .exec();

    return wishlistItems.map(item => {
      const product = item.product;
      let sellerName = 'Unknown Seller';
      let companyName = 'Unknown Company';
      let user: any = undefined;
      if (product && typeof product === 'object' && product !== null && (product as any).userId) {
        user = (product as any).userId;
      }
      if (user && typeof user.mail === 'string') {
        sellerName = user.mail;
        if (user.company && typeof user.company === 'object' && typeof user.company.companyName === 'string') {
          companyName = user.company.companyName;
        }
      }
      return {
        ...product,
        id: product._id?.toString?.() || product._id,
        companyName,
        sellerName,
      };
    });
  }
}
