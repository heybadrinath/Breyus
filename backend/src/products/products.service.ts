import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HSN } from './hsn.schema';

@Injectable()
export class ProductsService {
    constructor(@InjectModel(HSN.name) private readonly hsnModel: Model<HSN>) {}

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
}
