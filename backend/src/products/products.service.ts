import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HSN } from './schema/hsn.schema';
import { Product } from './schema/products.schema';
import { CreateProductDto } from './create-product.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(HSN.name) private readonly hsnModel: Model<HSN>,
    @InjectModel(Product.name) private readonly ProductSchema: Model<Product>
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

  async uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePaths: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);
      
      // Store relative path for database
      const relativePath = `uploads/${folder}/${fileName}`;
      filePaths.push(relativePath);
    }

    return filePaths;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return this.ProductSchema.find({userId}).exec();
  }

  async getProductById(productId: string, userId: string): Promise<Product | null> {
    return this.ProductSchema.findOne({ _id: productId, userId }).exec();
  }
}
