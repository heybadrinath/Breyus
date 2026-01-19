import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Wishlist } from './wishlist.schema';
import { Types } from 'mongoose';

/**
 * DTO for saving AI contacts to wishlist
 */
export interface SaveContactDto {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  commodity?: string;
  hsCode?: string;
  matchScore?: number;
  role?: 'buyer' | 'seller';
  notes?: string;
}

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
      const product = item.product as any;
      let sellerName = 'Unknown Seller';
      let companyName = 'Unknown Company';
      let user: any = undefined;
      if (product && typeof product === 'object' && product !== null && product.userId) {
        user = product.userId;
      }
      if (user && typeof user.mail === 'string') {
        sellerName = user.mail;
        if (user.company && typeof user.company === 'object' && typeof user.company.companyName === 'string') {
          companyName = user.company.companyName;
        }
      }
      return {
        ...(product || {}),
        id: product?._id?.toString?.() || product?._id || '',
        companyName,
        sellerName,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVED CONTACTS (AI off-platform companies)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Save an AI contact (off-platform company) to wishlist
   */
  async saveContact(userId: string, contact: SaveContactDto) {
    // Check if contact already exists (by email or name+country)
    const existingQuery: any = {
      user: new Types.ObjectId(userId),
      sourceType: 'ai_contact',
    };

    if (contact.email) {
      existingQuery.savedContactEmail = contact.email.toLowerCase();
    } else if (contact.name && contact.country) {
      existingQuery.savedContactName = { $regex: new RegExp(`^${contact.name}$`, 'i') };
      existingQuery.savedContactCountry = contact.country;
    }

    const exists = await this.wishlistSchema.findOne(existingQuery);

    if (exists) {
      throw new ConflictException('Contact already saved to wishlist');
    }

    const savedContact = await this.wishlistSchema.create({
      user: new Types.ObjectId(userId),
      sourceType: 'ai_contact',
      savedContactName: contact.name,
      savedContactEmail: contact.email?.toLowerCase(),
      savedContactPhone: contact.phone,
      savedContactCountry: contact.country,
      savedContactAddress: contact.address,
      savedCommodity: contact.commodity,
      savedHsCode: contact.hsCode,
      savedMatchScore: contact.matchScore,
      savedContactRole: contact.role,
      notes: contact.notes,
      dateAdded: new Date(),
    });

    return savedContact;
  }

  /**
   * Get all saved contacts for a user
   */
  async getSavedContacts(userId: string) {
    const contacts = await this.wishlistSchema
      .find({
        user: new Types.ObjectId(userId),
        sourceType: 'ai_contact',
      })
      .sort({ dateAdded: -1 })
      .lean()
      .exec();

    return contacts.map((contact: any) => ({
      id: contact._id.toString(),
      name: contact.savedContactName,
      email: contact.savedContactEmail,
      phone: contact.savedContactPhone,
      country: contact.savedContactCountry,
      address: contact.savedContactAddress,
      commodity: contact.savedCommodity,
      hsCode: contact.savedHsCode,
      matchScore: contact.savedMatchScore,
      role: contact.savedContactRole,
      notes: contact.notes,
      dateAdded: contact.dateAdded,
    }));
  }

  /**
   * Remove a saved contact from wishlist
   */
  async removeSavedContact(userId: string, contactId: string) {
    const result = await this.wishlistSchema.deleteOne({
      _id: new Types.ObjectId(contactId),
      user: new Types.ObjectId(userId),
      sourceType: 'ai_contact',
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Saved contact not found');
    }

    return { message: 'Contact removed from wishlist' };
  }

  /**
   * Update notes for a saved contact
   */
  async updateContactNotes(userId: string, contactId: string, notes: string) {
    const result = await this.wishlistSchema.findOneAndUpdate(
      {
        _id: new Types.ObjectId(contactId),
        user: new Types.ObjectId(userId),
        sourceType: 'ai_contact',
      },
      { notes },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Saved contact not found');
    }

    return result;
  }
}
