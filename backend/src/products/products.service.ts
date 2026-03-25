import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HSN } from './schema/hsn.schema';
import { Product } from './schema/products.schema';
import { CreateProductDto } from './create-product.dto';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';
import { StorageService } from '../common/storage/storage.service';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductWithCompany extends Partial<Product> {
  companyId?: string;
  companyName?: string;
  sellerName?: string;
}

interface PaginationResult {
  products: ProductWithCompany[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UserProductStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface UserProductPaginationResult extends PaginationResult {
  stats: UserProductStats;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private shouldGenerateSku(sku?: string): boolean {
    if (!sku || sku.trim().length === 0) return true;
    return !/^BRY-[A-Z0-9]{3,6}-\d{4}$/.test(sku.trim().toUpperCase());
  }

  private formatCategoryCode(category?: string): string {
    if (!category) return 'GEN';
    const cleaned = category.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleaned) return 'GEN';
    return cleaned.slice(0, 4);
  }

  private generateSku(category?: string): string {
    const categoryCode = this.formatCategoryCode(category);
    const randomNumber = Math.floor(Math.random() * 9000 + 1000);
    return `BRY-${categoryCode}-${randomNumber}`;
  }

  constructor(
    @InjectModel(HSN.name) private readonly hsnModel: Model<HSN>,
    @InjectModel(Product.name) private readonly ProductSchema: Model<Product>,
    @InjectModel(User.name) private readonly UserSchema: Model<User>,
    @InjectModel(Company.name) private readonly CompanySchema: Model<Company>,
    private readonly storageService: StorageService,
  ) {}

  async search(query: string): Promise<HSN[]> {
    const regexQuery = new RegExp(query, 'i'); // Case-insensitive regex search
    return this.hsnModel
      .find({
        $or: [
          { hsn_code: { $regex: regexQuery } },
          { description: { $regex: regexQuery } },
          { category: { $regex: regexQuery } },
        ],
      })
      .exec();
  }

  async createProduct(createProductDto: CreateProductDto, userId: string) {
    // Validate that MOQ unit and Stock unit are the same
    // This ensures consistent unit handling throughout the trade lifecycle
    if (createProductDto.moqUnit && createProductDto.stockUnit) {
      const moqUnit = createProductDto.moqUnit.toLowerCase().trim();
      const stockUnit = createProductDto.stockUnit.toLowerCase().trim();
      if (moqUnit !== stockUnit) {
        throw new Error('MOQ unit and Stock unit must be the same');
      }
    }

    if (this.shouldGenerateSku(createProductDto.sku)) {
      createProductDto.sku = this.generateSku(createProductDto.category);
    }

    // Add user ID to the product data
    const productData = {
      ...createProductDto,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newProduct = new this.ProductSchema(productData);
    return newProduct.save();
  }

  // Note: Filename sanitization is handled by StorageService centrally

  async uploadFiles(
    files: Express.Multer.File[],
  ): Promise<{ productImages: string[]; testReports: string[] }> {
    const productImages: string[] = [];
    const testReports: string[] = [];

    for (const file of files) {
      let folder = '';
      if (file.originalname.includes('product-images')) {
        folder = 'product-images';
      } else if (file.originalname.includes('test-reports')) {
        folder = 'test-reports';
      } else {
        continue; // skip files with no valid identifier
      }

      try {
        // Use StorageService for production-ready file uploads (supports S3, local, etc.)
        const fileName = `${Date.now()}-${file.originalname}`;
        const relativePath = await this.storageService.upload(
          file.buffer,
          fileName,
          folder,
        );

        if (folder === 'product-images') {
          productImages.push(relativePath);
        } else if (folder === 'test-reports') {
          testReports.push(relativePath);
        }

        this.logger.debug(`File uploaded successfully: ${relativePath}`);
      } catch (error) {
        this.logger.error(
          `Failed to upload file ${file.originalname}: ${error.message}`,
        );
        throw new HttpException(
          `Failed to upload file: ${file.originalname}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return { productImages, testReports };
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    const products = await this.ProductSchema.find({ userId }).exec();
    const updates: Array<{ id: string; sku: string }> = [];

    products.forEach((product) => {
      if (this.shouldGenerateSku(product.sku)) {
        const sku = this.generateSku(product.category);
        updates.push({ id: product.id, sku });
        product.sku = sku;
      }
    });

    if (updates.length > 0) {
      await Promise.all(
        updates.map((update) =>
          this.ProductSchema.updateOne(
            { _id: update.id, userId },
            { sku: update.sku, updatedAt: new Date() },
          ).exec(),
        ),
      );
    }

    return products;
  }

  async getProductsByUserWithPagination(
    userId: string,
    options: PaginationOptions & {
      stockStatus?: string;
      sort?: string;
      isMainstream?: boolean;
    },
  ): Promise<UserProductPaginationResult> {
    const { page, limit, search, category, stockStatus, sort, isMainstream } =
      options;
    const skip = (page - 1) * limit;

    const baseQuery: any = { userId };

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category) {
      baseQuery.category = { $regex: category, $options: 'i' };
    }

    // Filter by commodity classification (mainstream vs niche)
    // isMainstream: true → filter for mainstream products (isNicheCommodity: false)
    // isMainstream: false → filter for niche products (isNicheCommodity: true)
    if (isMainstream !== undefined) {
      baseQuery.isNicheCommodity = !isMainstream;
    }

    const allUserProducts = await this.ProductSchema.find({ userId })
      .lean()
      .exec();
    const stats = allUserProducts.reduce<UserProductStats>(
      (acc, product: any) => {
        const stock = parseFloat(product.stock || '0');
        if (stock > 10) acc.inStockProducts += 1;
        else if (stock > 0) acc.lowStockProducts += 1;
        else acc.outOfStockProducts += 1;
        acc.totalProducts += 1;
        return acc;
      },
      {
        totalProducts: 0,
        inStockProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
      },
    );

    let filteredProducts = await this.ProductSchema.find(baseQuery)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const skuUpdates: Array<{ id: string; sku: string }> = [];
    filteredProducts = filteredProducts.map((product: any) => {
      if (this.shouldGenerateSku(product.sku)) {
        const sku = this.generateSku(product.category);
        skuUpdates.push({ id: product._id.toString(), sku });
        return { ...product, sku };
      }
      return product;
    });

    if (skuUpdates.length > 0) {
      await Promise.all(
        skuUpdates.map((update) =>
          this.ProductSchema.updateOne(
            { _id: update.id, userId },
            { sku: update.sku, updatedAt: new Date() },
          ).exec(),
        ),
      );
    }

    if (stockStatus) {
      filteredProducts = filteredProducts.filter((product: any) => {
        const stock = parseFloat(product.stock || '0');
        if (stockStatus === 'in-stock') return stock > 10;
        if (stockStatus === 'low-stock') return stock > 0 && stock <= 10;
        if (stockStatus === 'out-of-stock') return stock <= 0;
        return true;
      });
    }

    if (sort) {
      const sortKey = sort.toLowerCase();
      filteredProducts.sort((a: any, b: any) => {
        if (sortKey === 'name-asc') return a.name.localeCompare(b.name);
        if (sortKey === 'name-desc') return b.name.localeCompare(a.name);
        if (sortKey === 'price-asc')
          return parseFloat(a.price || '0') - parseFloat(b.price || '0');
        if (sortKey === 'price-desc')
          return parseFloat(b.price || '0') - parseFloat(a.price || '0');
        if (sortKey === 'quantity-asc')
          return parseFloat(a.stock || '0') - parseFloat(b.stock || '0');
        if (sortKey === 'quantity-desc')
          return parseFloat(b.stock || '0') - parseFloat(a.stock || '0');
        return 0;
      });
    }

    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    return {
      products: paginatedProducts,
      currentPage: page,
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      stats,
    };
  }

  async getProductById(
    productId: string,
    userId: string,
  ): Promise<Product | null> {
    return this.ProductSchema.findOne({ _id: productId, userId }).exec();
  }

  async getProductByIdWithCompany(
    productId: string,
  ): Promise<ProductWithCompany | null> {
    try {
      const product = await this.ProductSchema.findById(productId)
        .populate({
          path: 'userId',
          model: 'User',
          select: 'mail company',
          populate: {
            path: 'company',
            model: 'Company',
            select: 'companyName',
          },
        })
        .lean()
        .exec();

      if (!product) {
        return null;
      }

      const user = product.userId as any;
      const company = user?.company;

      return {
        ...product,
        companyId:
          company?._id?.toString() || user?.company?.toString() || null,
        companyName: company?.companyName || 'Unknown Company',
        sellerName: user?.mail || 'Unknown Seller',
      };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateProduct(
    productId: string,
    userId: string,
    updateDto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    // Validate that MOQ unit and Stock unit are the same
    if (updateDto.moqUnit && updateDto.stockUnit) {
      const moqUnit = updateDto.moqUnit.toLowerCase().trim();
      const stockUnit = updateDto.stockUnit.toLowerCase().trim();
      if (moqUnit !== stockUnit) {
        throw new Error('MOQ unit and Stock unit must be the same');
      }
    }

    const product = await this.ProductSchema.findOne({
      _id: productId,
      userId,
    }).exec();
    if (!product) {
      return null;
    }

    let productImages = Array.isArray(updateDto.productImages)
      ? updateDto.productImages
      : product.productImages || [];
    let testReports = Array.isArray(updateDto.testReports)
      ? updateDto.testReports
      : product.testReports || [];

    if (files && files.length > 0) {
      const uploaded = await this.uploadFiles(files);
      if (uploaded.productImages.length > 0) {
        productImages = [...productImages, ...uploaded.productImages];
      }
      if (uploaded.testReports.length > 0) {
        testReports = [...testReports, ...uploaded.testReports];
      }
    }

    // Delete removed files using StorageService
    const removedImages = (product.productImages || []).filter(
      (img) => !productImages.includes(img),
    );
    const removedReports = (product.testReports || []).filter(
      (report) => !testReports.includes(report),
    );
    const filesToDelete = [...removedImages, ...removedReports];

    // Delete files asynchronously but don't block the update
    Promise.all(
      filesToDelete.map(async (filePath) => {
        try {
          await this.storageService.delete(filePath);
          this.logger.debug(`Deleted old file: ${filePath}`);
        } catch (error) {
          // Log but don't fail the update if file deletion fails
          this.logger.warn(
            `Failed to delete file ${filePath}: ${error.message}`,
          );
        }
      }),
    ).catch((error) => {
      this.logger.error(`Error during file cleanup: ${error.message}`);
    });

    const sku = this.shouldGenerateSku(updateDto.sku)
      ? this.generateSku(updateDto.category || product.category)
      : updateDto.sku;
    const updateData = {
      ...updateDto,
      sku,
      productImages,
      testReports,
      updatedAt: new Date(),
    };

    return this.ProductSchema.findByIdAndUpdate(productId, updateData, {
      new: true,
    }).exec();
  }

  async updateProductVisibility(
    productId: string,
    userId: string,
    isActive: boolean,
  ): Promise<Product | null> {
    return this.ProductSchema.findOneAndUpdate(
      { _id: productId, userId },
      { isActive, updatedAt: new Date() },
      { new: true },
    ).exec();
  }

  async deleteProduct(productId: string, userId: string): Promise<boolean> {
    const product = await this.ProductSchema.findOne({
      _id: productId,
      userId,
    }).exec();
    if (!product) {
      return false;
    }

    // Delete associated files using StorageService
    const filesToDelete = [
      ...(product.productImages || []),
      ...(product.testReports || []),
    ];

    // Delete files in parallel
    await Promise.all(
      filesToDelete.map(async (filePath) => {
        try {
          await this.storageService.delete(filePath);
          this.logger.debug(`Deleted product file: ${filePath}`);
        } catch (error) {
          // Log but continue - don't block product deletion if file cleanup fails
          this.logger.warn(
            `Failed to delete file ${filePath}: ${error.message}`,
          );
        }
      }),
    );

    await this.ProductSchema.deleteOne({ _id: productId, userId }).exec();
    return true;
  }

  async getProductsWithPagination(
    options: PaginationOptions,
  ): Promise<PaginationResult> {
    const { page, limit, search, category, minPrice, maxPrice } = options;
    const skip = (page - 1) * limit;

    // Build query conditions
    const queryConditions: any = { isActive: { $ne: false } };

    // Search condition
    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Category filter
    if (category) {
      queryConditions.category = { $regex: category, $options: 'i' };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      queryConditions.price = {};
      if (minPrice !== undefined) {
        queryConditions.price.$gte = minPrice.toString();
      }
      if (maxPrice !== undefined) {
        queryConditions.price.$lte = maxPrice.toString();
      }
    }

    // Get total count for pagination
    const totalProducts =
      await this.ProductSchema.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products with pagination and populate user and company information
    const products = await this.ProductSchema.find(queryConditions)
      .populate({
        path: 'userId',
        model: 'User',
        select: 'mail company',
        populate: {
          path: 'company',
          model: 'Company',
          select: 'companyName',
        },
      })
      .sort({ isFeatured: -1, featuredAt: -1, createdAt: -1 }) // Featured first, then newest
      .skip(skip)
      .limit(limit)
      .lean() // Convert to plain JavaScript objects
      .exec();

    // Transform products to include company name and ID
    const productsWithCompany: ProductWithCompany[] = products.map(
      (product) => {
        const user = product.userId as any;
        const company = user?.company;

        return {
          ...product,
          companyId:
            company?._id?.toString() || user?.company?.toString() || null,
          companyName: company?.companyName || 'Unknown Company',
          sellerName: user?.mail || 'Unknown Seller',
        };
      },
    );

    return {
      products: productsWithCompany,
      currentPage: page,
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Get products by company ID
   * Returns all active products from users belonging to the specified company
   */
  async getProductsByCompanyId(
    companyId: string,
    options: { page: number; limit: number; search?: string },
  ): Promise<PaginationResult> {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(companyId)) {
        throw new HttpException(
          'Invalid company ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { page, limit, search } = options;
      const skip = (page - 1) * limit;

      // Find all users belonging to this company
      const users = await this.UserSchema.find({
        company: new Types.ObjectId(companyId),
      })
        .select('_id')
        .exec();

      if (users.length === 0) {
        return {
          products: [],
          currentPage: page,
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const userIds = users.map((u) => u._id);

      // Build query conditions
      const queryConditions: any = {
        userId: { $in: userIds },
        isActive: { $ne: false },
      };

      // Add search condition if provided
      if (search) {
        queryConditions.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      // Get total count
      const totalProducts =
        await this.ProductSchema.countDocuments(queryConditions);
      const totalPages = Math.ceil(totalProducts / limit);

      // Get products with company information
      const products = await this.ProductSchema.find(queryConditions)
        .populate({
          path: 'userId',
          model: 'User',
          select: 'mail company',
          populate: {
            path: 'company',
            model: 'Company',
            select: 'companyName',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // Transform products to include company info
      const productsWithCompany: ProductWithCompany[] = products.map(
        (product) => {
          const user = product.userId as any;
          const company = user?.company;

          return {
            ...product,
            companyId: company?._id?.toString() || companyId,
            companyName: company?.companyName || 'Unknown Company',
            sellerName: user?.mail || 'Unknown Seller',
          };
        },
      );

      return {
        products: productsWithCompany,
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get products by company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // VIEW TRACKING (for real analytics - replaces fake visits calculation)
  // ============================================================================

  /**
   * Track a product view from a buyer
   * - Increments total viewCount
   * - Updates lastViewedAt timestamp
   * - Aggregates daily views for analytics (keeps rolling 90-day history)
   * - Does NOT count views from the product's own seller
   *
   * @param productId - The product being viewed
   * @param viewerCompanyId - The company ID of the viewer (to exclude self-views)
   */
  async trackProductView(
    productId: string,
    viewerCompanyId: string,
  ): Promise<{ success: boolean }> {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(productId)) {
        return { success: false };
      }

      const product = await this.ProductSchema.findById(productId)
        .select('userId')
        .lean();
      if (!product) {
        return { success: false };
      }

      // Don't count seller's own views of their products
      // The userId in Product is the user's _id as a string
      const productOwnerId = product.userId?.toString();

      // Check if viewer is the product owner (either directly or via company)
      if (productOwnerId === viewerCompanyId) {
        return { success: false }; // Self-view, don't count
      }

      // Also check if the viewer's company owns this product
      // Get the company for this product's owner
      const productOwner = await this.UserSchema.findById(productOwnerId)
        .select('company')
        .lean();
      if (productOwner?.company?.toString() === viewerCompanyId) {
        return { success: false }; // Same company, don't count
      }

      // Get today's date at midnight UTC for consistent daily aggregation
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Try to increment existing daily view entry first
      const updateResult = await this.ProductSchema.updateOne(
        {
          _id: productId,
          'dailyViews.date': today,
        },
        {
          $inc: { viewCount: 1, 'dailyViews.$.count': 1 },
          $set: { lastViewedAt: new Date() },
        },
      );

      // If no existing entry for today, add a new one
      if (updateResult.modifiedCount === 0) {
        await this.ProductSchema.updateOne(
          { _id: productId },
          {
            $inc: { viewCount: 1 },
            $set: { lastViewedAt: new Date() },
            $push: {
              dailyViews: {
                $each: [{ date: today, count: 1 }],
                $slice: -90, // Keep only last 90 days of view data
              },
            },
          },
        );
      }

      return { success: true };
    } catch (error) {
      // Silently fail for view tracking - it's not critical
      console.error('Error tracking product view:', error);
      return { success: false };
    }
  }

  /**
   * Get aggregated view statistics for analytics
   * Used by the analytics service to replace fake visits calculation
   *
   * @param productIds - Array of product IDs to get view stats for
   * @param startDate - Start of date range
   * @param endDate - End of date range
   */
  async getProductViewStats(
    productIds: Types.ObjectId[],
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalViews: number;
    viewsByDate: { [dateKey: string]: number };
  }> {
    try {
      if (productIds.length === 0) {
        return { totalViews: 0, viewsByDate: {} };
      }

      const products = await this.ProductSchema.find({
        _id: { $in: productIds },
      })
        .select('dailyViews viewCount')
        .lean();

      let totalViews = 0;
      const viewsByDate: { [dateKey: string]: number } = {};

      for (const product of products) {
        if (product.dailyViews) {
          for (const view of product.dailyViews as {
            date: Date;
            count: number;
          }[]) {
            const viewDate = new Date(view.date);
            if (viewDate >= startDate && viewDate <= endDate) {
              totalViews += view.count;

              // Format date as YYYY-MM-DD for consistent aggregation
              const dateKey = viewDate.toISOString().split('T')[0];
              viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + view.count;
            }
          }
        }
      }

      return { totalViews, viewsByDate };
    } catch (error) {
      console.error('Error getting product view stats:', error);
      return { totalViews: 0, viewsByDate: {} };
    }
  }
}
