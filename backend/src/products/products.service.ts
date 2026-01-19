import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HSN } from './schema/hsn.schema';
import { Product } from './schema/products.schema';
import { CreateProductDto } from './create-product.dto';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';
import * as fs from 'fs';
import * as path from 'path';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductWithCompany extends Partial<Product> {
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
    @InjectModel(Company.name) private readonly CompanySchema: Model<Company>
  ) { }

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
    if (this.shouldGenerateSku(createProductDto.sku)) {
      createProductDto.sku = this.generateSku(createProductDto.category);
    }

    // Add user ID to the product data
    const productData = {
      ...createProductDto,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newProduct = new this.ProductSchema(productData);
    return newProduct.save();
  }

  /**
   * SECURITY FIX: Sanitize filename to prevent path traversal attacks (Audit Bug - Path Traversal)
   */
  private sanitizeFilename(filename: string): string {
    if (!filename) {
      return `unnamed-${Date.now()}`;
    }

    let sanitized = filename
      .replace(/\.\./g, '')          // Remove .. sequences
      .replace(/[\/\\]/g, '_')       // Replace path separators
      .replace(/[<>:"|?*\x00-\x1f]/g, '_')  // Remove dangerous chars
      .replace(/^[\s.]+|[\s.]+$/g, '')      // Remove leading/trailing dots/spaces
      .replace(/[_-]{2,}/g, '_');           // Collapse multiple underscores

    // Limit filename length
    if (sanitized.length > 200) {
      const lastDot = sanitized.lastIndexOf('.');
      if (lastDot > 0 && lastDot > sanitized.length - 10) {
        const extension = sanitized.substring(lastDot);
        sanitized = sanitized.substring(0, 200 - extension.length) + extension;
      } else {
        sanitized = sanitized.substring(0, 200);
      }
    }

    return sanitized || `unnamed-${Date.now()}`;
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<{ productImages: string[], testReports: string[] }> {
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
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      // SECURITY FIX: Sanitize filename to prevent path traversal (Audit Bug - Path Traversal)
      const sanitizedOriginalName = this.sanitizeFilename(file.originalname);
      const fileName = `${Date.now()}-${sanitizedOriginalName}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      const relativePath = `uploads/${folder}/${fileName}`;
      if (folder === 'product-images') {
        productImages.push(relativePath);
      } else if (folder === 'test-reports') {
        testReports.push(relativePath);
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
            { sku: update.sku, updatedAt: new Date() }
          ).exec()
        )
      );
    }

    return products;
  }

  async getProductsByUserWithPagination(
    userId: string,
    options: PaginationOptions & { stockStatus?: string; sort?: string; isMainstream?: boolean }
  ): Promise<UserProductPaginationResult> {
    const { page, limit, search, category, stockStatus, sort, isMainstream } = options;
    const skip = (page - 1) * limit;

    const baseQuery: any = { userId };

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
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

    const allUserProducts = await this.ProductSchema.find({ userId }).lean().exec();
    const stats = allUserProducts.reduce<UserProductStats>(
      (acc, product: any) => {
        const stock = parseFloat(product.stock || '0');
        if (stock > 10) acc.inStockProducts += 1;
        else if (stock > 0) acc.lowStockProducts += 1;
        else acc.outOfStockProducts += 1;
        acc.totalProducts += 1;
        return acc;
      },
      { totalProducts: 0, inStockProducts: 0, lowStockProducts: 0, outOfStockProducts: 0 }
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
            { sku: update.sku, updatedAt: new Date() }
          ).exec()
        )
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
        if (sortKey === 'price-asc') return parseFloat(a.price || '0') - parseFloat(b.price || '0');
        if (sortKey === 'price-desc') return parseFloat(b.price || '0') - parseFloat(a.price || '0');
        if (sortKey === 'quantity-asc') return parseFloat(a.stock || '0') - parseFloat(b.stock || '0');
        if (sortKey === 'quantity-desc') return parseFloat(b.stock || '0') - parseFloat(a.stock || '0');
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

  async getProductById(productId: string, userId: string): Promise<Product | null> {
    return this.ProductSchema.findOne({ _id: productId, userId }).exec();
  }

  async getProductByIdWithCompany(productId: string): Promise<ProductWithCompany | null> {
    try {
      const product = await this.ProductSchema
        .findById(productId)
        .populate({
          path: 'userId',
          model: 'User',
          select: 'mail company',
          populate: {
            path: 'company',
            model: 'Company',
            select: 'companyName'
          }
        })
        .lean()
        .exec();

      if (!product) {
        return null;
      }

      const user = product.userId as any;
      const company = user?.company as any;
      
      return {
        ...product,
        companyName: company?.companyName || 'Unknown Company',
        sellerName: user?.mail || 'Unknown Seller'
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
    const product = await this.ProductSchema.findOne({ _id: productId, userId }).exec();
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

    const removedImages = (product.productImages || []).filter((img) => !productImages.includes(img));
    const removedReports = (product.testReports || []).filter((report) => !testReports.includes(report));
    [...removedImages, ...removedReports].forEach((filePath) => {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        // Ignore file deletion errors
      }
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

    return this.ProductSchema.findByIdAndUpdate(productId, updateData, { new: true }).exec();
  }

  async updateProductVisibility(
    productId: string,
    userId: string,
    isActive: boolean
  ): Promise<Product | null> {
    return this.ProductSchema.findOneAndUpdate(
      { _id: productId, userId },
      { isActive, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  async deleteProduct(productId: string, userId: string): Promise<boolean> {
    const product = await this.ProductSchema.findOne({ _id: productId, userId }).exec();
    if (!product) {
      return false;
    }

    const filesToDelete = [...(product.productImages || []), ...(product.testReports || [])];
    filesToDelete.forEach((filePath) => {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        // Ignore file deletion errors
      }
    });

    await this.ProductSchema.deleteOne({ _id: productId, userId }).exec();
    return true;
  }

  async getProductsWithPagination(options: PaginationOptions): Promise<PaginationResult> {
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
        { tags: { $in: [new RegExp(search, 'i')] } }
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
    const totalProducts = await this.ProductSchema.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products with pagination and populate user and company information
    const products = await this.ProductSchema
      .find(queryConditions)
      .populate({
        path: 'userId',
        model: 'User',
        select: 'mail company',
        populate: {
          path: 'company',
          model: 'Company',
          select: 'companyName'
        }
      })
      .sort({ isFeatured: -1, featuredAt: -1, createdAt: -1 }) // Featured first, then newest
      .skip(skip)
      .limit(limit)
      .lean() // Convert to plain JavaScript objects
      .exec();

    // Transform products to include company name
    const productsWithCompany: ProductWithCompany[] = products.map(product => {
      const user = product.userId as any;
      const company = user?.company as any;
      
      return {
        ...product,
        companyName: company?.companyName || 'Unknown Company',
        sellerName: user?.mail || 'Unknown Seller'
      };
    });

    return {
      products: productsWithCompany,
      currentPage: page,
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
}
