import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';
import { Product } from '../products/schema/products.schema';
import { Wishlist } from '../wishlist/wishlist.schema';
import { emailTemplates } from '../mail/templates/email.templates';

/**
 * MiscNotificationService
 *
 * Handles miscellaneous notifications that don't fit into trade or dispute flows:
 * - Welcome emails after registration
 * - Onboarding completion notifications
 * - Product back-in-stock alerts
 * - Contact/company saved confirmations
 */
@Injectable()
export class MiscNotificationService {
  private readonly logger = new Logger(MiscNotificationService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>,
  ) {}

  /**
   * Send welcome email after user completes registration (SetPassword step)
   * This is a comprehensive onboarding email with platform introduction
   */
  async sendWelcomeEmail(
    userId: string,
    email: string,
    companyId: string,
    role: 'buyer' | 'seller',
  ): Promise<void> {
    try {
      // Get company name for personalization
      const company = await this.companyModel
        .findById(companyId)
        .select('companyName founderName')
        .lean();

      const userName = company?.founderName || email.split('@')[0];
      const companyName = company?.companyName || 'Your Company';

      // Generate email HTML
      const emailHtml = emailTemplates.welcomeEmail(userName, companyName, role);

      // Send email
      await this.mailService.sendTradeNotificationEmail(
        email,
        'Welcome to Breyus - Your Commodity Trading Journey Begins!',
        emailHtml,
      );

      // Create in-app notification
      await this.notificationService.createNotification({
        userId,
        type: 'welcome_email',
        title: 'Welcome to Breyus!',
        message: `Welcome aboard, ${userName}! Start exploring the platform and discover trading opportunities.`,
        priority: 'normal',
        actionUrl: role === 'buyer' ? '/buyer/homepage' : '/seller/dashboard',
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw - welcome email failure shouldn't block registration
    }
  }

  /**
   * Send notification when user completes onboarding (step 5)
   */
  async sendOnboardingCompleteNotification(
    userId: string,
    email: string,
    companyName: string,
    role: 'buyer' | 'seller',
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.notificationService.createNotification({
        userId,
        type: 'onboarding_completed',
        title: 'Onboarding Complete!',
        message: `Congratulations! ${companyName} is now fully set up on Breyus. Start ${role === 'buyer' ? 'browsing products' : 'listing your products'}.`,
        priority: 'normal',
        actionUrl: role === 'buyer' ? '/buyer/homepage' : '/seller/add-products',
      });

      this.logger.log(`Onboarding complete notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send onboarding complete notification to ${email}:`,
        error,
      );
    }
  }

  /**
   * Notify users who have the product in their wishlist when it's back in stock
   * Called when product stock changes from 0 to > 0
   */
  async notifyProductBackInStock(productId: string): Promise<number> {
    try {
      // Get product details
      const product = await this.productModel
        .findById(productId)
        .populate('userId', 'mail company')
        .lean();

      if (!product) {
        this.logger.warn(`Product ${productId} not found for stock alert`);
        return 0;
      }

      // Get seller company name
      const seller = product.userId as any;
      let sellerCompanyName = 'Unknown Seller';
      if (seller?.company) {
        const sellerCompany = await this.companyModel
          .findById(seller.company)
          .select('companyName')
          .lean();
        sellerCompanyName = sellerCompany?.companyName || 'Unknown Seller';
      }

      // Find all wishlists that contain this product
      const wishlists = await this.wishlistModel
        .find({ product: new Types.ObjectId(productId) })
        .populate('user', 'mail _id')
        .lean();

      if (wishlists.length === 0) {
        this.logger.log(
          `No wishlists contain product ${productId}, skipping stock alert`,
        );
        return 0;
      }

      const baseUrl = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ).replace(/\/+$/, '');
      const actionUrl = `${baseUrl}/buyer/product-page?id=${productId}`;

      // Send notifications to each user
      let sentCount = 0;
      for (const wishlist of wishlists) {
        const user = wishlist.user as any;
        if (!user?._id || !user?.mail) continue;

        try {
          // Generate email HTML
          const emailHtml = emailTemplates.productBackInStock(
            (product as any).name,
            sellerCompanyName,
            actionUrl,
          );

          // Send email
          await this.mailService.sendTradeNotificationEmail(
            user.mail,
            `Back In Stock: ${(product as any).name}`,
            emailHtml,
          );

          // Create in-app notification
          await this.notificationService.createNotification({
            userId: user._id.toString(),
            type: 'product_back_in_stock',
            title: 'Wishlist Item Back In Stock!',
            message: `${(product as any).name} from ${sellerCompanyName} is now available.`,
            priority: 'normal',
            actionUrl,
            metadata: { productId, productName: (product as any).name },
          });

          sentCount++;
        } catch (err) {
          this.logger.error(
            `Failed to send stock alert to user ${user._id}:`,
            err,
          );
        }
      }

      this.logger.log(
        `Sent ${sentCount} stock alerts for product ${productId}`,
      );
      return sentCount;
    } catch (error) {
      this.logger.error(
        `Failed to notify product back in stock for ${productId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Notify users when a wishlisted product's price drops
   */
  async notifyWishlistPriceDropped(
    productId: string,
    oldPrice: number,
    newPrice: number,
    currency: string,
  ): Promise<number> {
    try {
      // Only notify if price actually dropped
      if (newPrice >= oldPrice) {
        return 0;
      }

      // Get product details
      const product = await this.productModel.findById(productId).lean();

      if (!product) {
        this.logger.warn(`Product ${productId} not found for price drop alert`);
        return 0;
      }

      // Find all wishlists that contain this product
      const wishlists = await this.wishlistModel
        .find({ product: new Types.ObjectId(productId) })
        .populate('user', 'mail _id')
        .lean();

      if (wishlists.length === 0) {
        return 0;
      }

      const baseUrl = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ).replace(/\/+$/, '');
      const actionUrl = `${baseUrl}/buyer/product-page?id=${productId}`;

      // Send notifications to each user
      let sentCount = 0;
      for (const wishlist of wishlists) {
        const user = wishlist.user as any;
        if (!user?._id || !user?.mail) continue;

        try {
          // Generate email HTML
          const emailHtml = emailTemplates.wishlistPriceDropped(
            (product as any).name,
            oldPrice,
            newPrice,
            currency,
            actionUrl,
          );

          // Send email
          await this.mailService.sendTradeNotificationEmail(
            user.mail,
            `Price Drop: ${(product as any).name}`,
            emailHtml,
          );

          // Create in-app notification
          await this.notificationService.createNotification({
            userId: user._id.toString(),
            type: 'wishlist_price_dropped',
            title: 'Price Drop Alert!',
            message: `${(product as any).name} price dropped from ${currency} ${oldPrice} to ${currency} ${newPrice}.`,
            priority: 'normal',
            actionUrl,
            metadata: {
              productId,
              productName: (product as any).name,
              oldPrice,
              newPrice,
              currency,
            },
          });

          sentCount++;
        } catch (err) {
          this.logger.error(
            `Failed to send price drop alert to user ${user._id}:`,
            err,
          );
        }
      }

      this.logger.log(
        `Sent ${sentCount} price drop alerts for product ${productId}`,
      );
      return sentCount;
    } catch (error) {
      this.logger.error(
        `Failed to notify price drop for ${productId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Notify user when they save a contact
   */
  async notifyContactSaved(
    userId: string,
    email: string,
    contactName: string,
    contactEmail: string,
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId,
        type: 'contact_saved',
        title: 'Contact Saved',
        message: `${contactName} (${contactEmail}) has been added to your contacts.`,
        priority: 'low',
        actionUrl: '/buyer/contacts',
      });

      this.logger.log(`Contact saved notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact saved notification to ${email}:`,
        error,
      );
    }
  }

  /**
   * Notify user when they favourite a company
   */
  async notifyCompanyFavourited(
    userId: string,
    email: string,
    companyName: string,
    companyId: string,
  ): Promise<void> {
    try {
      const baseUrl = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ).replace(/\/+$/, '');

      await this.notificationService.createNotification({
        userId,
        type: 'company_favourited',
        title: 'Company Added to Favorites',
        message: `${companyName} has been added to your favorite companies.`,
        priority: 'low',
        actionUrl: `${baseUrl}/buyer/seller-profile/${companyId}`,
        metadata: { companyId, companyName },
      });

      this.logger.log(`Company favourited notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send company favourited notification to ${email}:`,
        error,
      );
    }
  }

  /**
   * Send analysis completed notification
   * Called when async market analysis job completes
   */
  async sendAnalysisCompletedNotification(
    userId: string,
    email: string,
    commodityName: string,
    jobId: string,
  ): Promise<void> {
    try {
      const baseUrl = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ).replace(/\/+$/, '');
      const actionUrl = `${baseUrl}/buyer/ai-result?jobId=${jobId}`;

      // Generate email HTML
      const emailHtml = emailTemplates.analysisCompleted(commodityName, actionUrl);

      // Send email
      await this.mailService.sendTradeNotificationEmail(
        email,
        `Market Analysis Ready: ${commodityName}`,
        emailHtml,
      );

      // Create in-app notification
      await this.notificationService.createNotification({
        userId,
        type: 'analysis_completed',
        title: 'Market Analysis Ready',
        message: `Your analysis for ${commodityName} is complete. View the results now.`,
        priority: 'normal',
        actionUrl,
        metadata: { jobId, commodityName },
      });

      this.logger.log(`Analysis completed notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send analysis completed notification to ${email}:`,
        error,
      );
    }
  }
}
