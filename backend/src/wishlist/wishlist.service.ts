import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
    @InjectModel(Wishlist.name)
    private readonly wishlistSchema: ReturnModelType<typeof Wishlist>,
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
      .find({
        user: new Types.ObjectId(userId),
        sourceType: 'product', // Only get product wishlists
        product: { $exists: true },
      })
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
            select: 'companyName',
          },
        },
      })
      .sort({ dateAdded: -1 })
      .lean()
      .exec();

    return wishlistItems
      .filter((item) => item.product) // Filter out items where product is null/deleted
      .map((item) => {
        const product = item.product as any;
        let sellerName = 'Unknown Seller';
        let companyName = 'Unknown Company';
        let user: any = undefined;
        if (
          product &&
          typeof product === 'object' &&
          product !== null &&
          product.userId
        ) {
          user = product.userId;
        }
        if (user && typeof user.mail === 'string') {
          sellerName = user.mail;
          if (
            user.company &&
            typeof user.company === 'object' &&
            typeof user.company.companyName === 'string'
          ) {
            companyName = user.company.companyName;
          }
        }
        return {
          id: product?._id?.toString?.() || product?._id || '',
          name: product?.name || 'Unnamed Product',
          description: product?.description || '',
          price: product?.price || 0,
          salePrice: product?.salePrice,
          currency: product?.currency || 'USD',
          onSale: product?.onSale || false,
          productImages: product?.productImages || [],
          images: product?.productImages || [],
          primaryImage: product?.productImages?.[0] || '',
          category: product?.category || '',
          stock: product?.stock || 0,
          stockUnit: product?.stockUnit || '',
          moq: product?.moq || '',
          moqUnit: product?.moqUnit || '',
          isFeatured: product?.isFeatured || false,
          companyName,
          sellerName,
          dateAdded: item.dateAdded,
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
      existingQuery.savedContactName = {
        $regex: new RegExp(`^${contact.name}$`, 'i'),
      };
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

  // ═══════════════════════════════════════════════════════════════
  // FAVOURITE COMPANIES (platform companies favourited by buyers)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add a company to favourites
   */
  async addFavouriteCompany(userId: string, companyId: string, notes?: string) {
    // Check if already favourited
    const exists = await this.wishlistSchema.findOne({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
      sourceType: 'company',
    });

    if (exists) {
      throw new ConflictException('Company already in favourites');
    }

    const favourite = await this.wishlistSchema.create({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
      sourceType: 'company',
      notes,
      dateAdded: new Date(),
    });

    return favourite;
  }

  /**
   * Remove a company from favourites
   */
  async removeFavouriteCompany(userId: string, companyId: string) {
    const result = await this.wishlistSchema.deleteOne({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
      sourceType: 'company',
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Favourite company not found');
    }

    return { message: 'Company removed from favourites' };
  }

  /**
   * Get all favourite companies for a user
   */
  async getFavouriteCompanies(userId: string) {
    const favourites = await this.wishlistSchema
      .find({
        user: new Types.ObjectId(userId),
        sourceType: 'company',
      })
      .populate({
        path: 'company',
        model: 'Company',
        select:
          'companyName companyAddress profilePicture bannerImage isKycVerified primaryEmail',
      })
      .sort({ dateAdded: -1 })
      .lean()
      .exec();

    return favourites.map((item: any) => {
      const company = item.company;
      return {
        id: item._id.toString(),
        companyId: company?._id?.toString() || '',
        companyName: company?.companyName || 'Unknown Company',
        companyAddress: company?.companyAddress || '',
        profilePicture: company?.profilePicture || '',
        bannerImage: company?.bannerImage || '',
        isKycVerified: company?.isKycVerified || false,
        primaryEmail: company?.primaryEmail || '',
        notes: item.notes || '',
        dateAdded: item.dateAdded,
      };
    });
  }

  /**
   * Check if a company is favourited by the user
   */
  async isFavouriteCompany(
    userId: string,
    companyId: string,
  ): Promise<boolean> {
    const exists = await this.wishlistSchema.findOne({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
      sourceType: 'company',
    });

    return !!exists;
  }
}
