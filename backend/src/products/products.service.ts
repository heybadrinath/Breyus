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

@Injectable()
export class ProductsService {
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
      const fileName = `${Date.now()}-${file.originalname}`;
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
    return this.ProductSchema.find({userId}).exec();
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

  async getProductsWithPagination(options: PaginationOptions): Promise<PaginationResult> {
    const { page, limit, search, category, minPrice, maxPrice } = options;
    const skip = (page - 1) * limit;

    // Build query conditions
    const queryConditions: any = {};

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
      .sort({ createdAt: -1 }) // Sort by newest first
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
