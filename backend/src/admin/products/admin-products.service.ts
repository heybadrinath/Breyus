import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../products/schema/products.schema';
import { ActivityLogService } from '../activity/activity-log.service';
import { Types } from 'mongoose';
import { GetProductsQueryDto } from './dto';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get paginated list of products with filters
   */
  async getProducts(params: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sellerId,
      isActive,
      isDeactivated,
      isFeatured,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (sellerId) {
      query.userId = sellerId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isDeactivated !== undefined) {
      query.isDeactivated = isDeactivated;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await this.productModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await this.productModel
      .find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string) {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      deactivatedProducts,
      featuredProducts,
      nicheProducts,
    ] = await Promise.all([
      this.productModel.countDocuments().exec(),
      this.productModel.countDocuments({ isActive: true, isDeactivated: { $ne: true } }).exec(),
      this.productModel.countDocuments({ isDeactivated: true }).exec(),
      this.productModel.countDocuments({ isFeatured: true }).exec(),
      this.productModel.countDocuments({ isNicheCommodity: true }).exec(),
    ]);

    // Get products by category
    const byCategory = await this.productModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).exec();

    // Get products created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProducts = await this.productModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    }).exec();

    return {
      total: totalProducts,
      active: activeProducts,
      deactivated: deactivatedProducts,
      featured: featuredProducts,
      niche: nicheProducts,
      recentlyAdded: recentProducts,
      byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    };
  }

  /**
   * Deactivate a product (admin moderation)
   */
  async deactivateProduct(
    productId: string,
    reason: string,
    adminId: string,
    adminEmail: string,
  ) {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousValue = {
      isDeactivated: product.isDeactivated,
      deactivatedAt: product.deactivatedAt,
      deactivatedBy: product.deactivatedBy,
      deactivationReason: product.deactivationReason,
    };

    product.isDeactivated = true;
    product.deactivatedAt = new Date();
    product.deactivatedBy = adminId;
    product.deactivationReason = reason;
    product.updatedAt = new Date();

    await product.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'product.deactivate',
      actionCategory: 'products',
      targetType: 'product',
      targetId: new Types.ObjectId(productId),
      targetIdentifier: product.name,
      description: `Deactivated product "${product.name}" - Reason: ${reason}`,
      previousValue,
      newValue: {
        isDeactivated: true,
        deactivatedAt: product.deactivatedAt,
        deactivatedBy: adminId,
        deactivationReason: reason,
      },
    });

    return product;
  }

  /**
   * Reactivate a product
   */
  async reactivateProduct(productId: string, adminId: string, adminEmail: string) {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isDeactivated) {
      throw new NotFoundException('Product is not deactivated');
    }

    const previousValue = {
      isDeactivated: product.isDeactivated,
      deactivatedAt: product.deactivatedAt,
      deactivatedBy: product.deactivatedBy,
      deactivationReason: product.deactivationReason,
    };

    product.isDeactivated = false;
    product.deactivatedAt = undefined;
    product.deactivatedBy = undefined;
    product.deactivationReason = undefined;
    product.updatedAt = new Date();

    await product.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'product.reactivate',
      actionCategory: 'products',
      targetType: 'product',
      targetId: new Types.ObjectId(productId),
      targetIdentifier: product.name,
      description: `Reactivated product "${product.name}"`,
      previousValue,
      newValue: {
        isDeactivated: false,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null,
      },
    });

    return product;
  }

  /**
   * Feature a product
   */
  async featureProduct(productId: string, adminId: string, adminEmail: string) {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.isFeatured) {
      throw new NotFoundException('Product is already featured');
    }

    const previousValue = {
      isFeatured: product.isFeatured,
      featuredAt: product.featuredAt,
      featuredBy: product.featuredBy,
    };

    product.isFeatured = true;
    product.featuredAt = new Date();
    product.featuredBy = adminId;
    product.updatedAt = new Date();

    await product.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'product.feature',
      actionCategory: 'products',
      targetType: 'product',
      targetId: new Types.ObjectId(productId),
      targetIdentifier: product.name,
      description: `Featured product "${product.name}"`,
      previousValue,
      newValue: {
        isFeatured: true,
        featuredAt: product.featuredAt,
        featuredBy: adminId,
      },
    });

    return product;
  }

  /**
   * Unfeature a product
   */
  async unfeatureProduct(productId: string, adminId: string, adminEmail: string) {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isFeatured) {
      throw new NotFoundException('Product is not featured');
    }

    const previousValue = {
      isFeatured: product.isFeatured,
      featuredAt: product.featuredAt,
      featuredBy: product.featuredBy,
    };

    product.isFeatured = false;
    product.featuredAt = undefined;
    product.featuredBy = undefined;
    product.updatedAt = new Date();

    await product.save();

    // Log activity
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'product.unfeature',
      actionCategory: 'products',
      targetType: 'product',
      targetId: new Types.ObjectId(productId),
      targetIdentifier: product.name,
      description: `Removed featured status from product "${product.name}"`,
      previousValue,
      newValue: {
        isFeatured: false,
        featuredAt: null,
        featuredBy: null,
      },
    });

    return product;
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const categories = await this.productModel.distinct('category').exec();
    return categories.filter((c) => c); // Filter out null/undefined
  }
}
