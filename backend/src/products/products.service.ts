import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HSN } from './schema/hsn.schema';
import { Product } from './schema/products.schema';
import { CreateProductDto } from './create-product.dto';

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

  async createProduct(createProductDto: CreateProductDto){
    const newProduct = new this.ProductSchema(createProductDto);
    return newProduct.save();
  }

}
